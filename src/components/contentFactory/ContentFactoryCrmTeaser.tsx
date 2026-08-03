import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileStack, Loader2 } from 'lucide-react';
import {
    agentLkApi,
    type ContentFactoryOfferListItem,
} from '../../api/agentLkApi';
import OfferPreviewThumb from './OfferPreviewThumb';
import { useContentFactoryPreviewCache } from '../../hooks/useContentFactoryPreviewCache';
import type { NavPage } from '../lk/lkNavigation';

interface ContentFactoryCrmTeaserProps {
    onNavigate: (page: NavPage) => void;
}

const PREVIEW_LIMIT = 6;

const ContentFactoryCrmTeaser: React.FC<ContentFactoryCrmTeaserProps> = ({ onNavigate }) => {
    const [offers, setOffers] = useState<ContentFactoryOfferListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const previewOffers = useMemo(() => offers.slice(0, PREVIEW_LIMIT), [offers]);
    const previewIds = useMemo(() => previewOffers.map((item) => item.id), [previewOffers]);
    const { cache, loadingIds, failedIds } = useContentFactoryPreviewCache(previewIds);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const list = await agentLkApi.listContentFactoryOffers();
                if (!cancelled) setOffers(list);
            } catch {
                if (!cancelled) setOffers([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const subtitle = useMemo(() => {
        if (loading) return 'Загружаем каталог…';
        if (offers.length === 0) return 'Пока нет опубликованных листов';
        if (offers.length > PREVIEW_LIMIT) {
            return `${offers.length} материалов · ниже первые ${PREVIEW_LIMIT}`;
        }
        return `${offers.length} материал(ов) · превью, PDF и email клиенту`;
    }, [loading, offers.length]);

    const openMaterials = () => onNavigate('content-factory');

    return (
        <section className="cf-crm-teaser" aria-label="Content Factory">
            <div className="cf-crm-teaser__head">
                <div className="cf-crm-teaser__text">
                    <span className="cf-crm-teaser__eyebrow">Content Factory</span>
                    <h2 className="cf-crm-teaser__title">Материалы для клиентов</h2>
                    <p className="cf-crm-teaser__subtitle">{subtitle}</p>
                </div>
                <button type="button" className="cf-crm-teaser__cta" onClick={openMaterials}>
                    Открыть все
                    <ArrowRight size={16} />
                </button>
            </div>

            {loading ? (
                <div className="cf-crm-teaser__gallery cf-crm-teaser__gallery--loading">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Загрузка превью…</span>
                </div>
            ) : previewOffers.length === 0 ? (
                <button type="button" className="cf-crm-teaser__empty" onClick={openMaterials}>
                    <FileStack size={18} />
                    <span>Перейти в материалы</span>
                </button>
            ) : (
                <div className="cf-crm-teaser__gallery" role="list">
                    {previewOffers.map((offer) => (
                        <button
                            key={offer.id}
                            type="button"
                            className="cf-crm-teaser__card"
                            role="listitem"
                            onClick={openMaterials}
                            title={offer.title}
                        >
                            <OfferPreviewThumb
                                title={offer.title}
                                html={cache[offer.id]}
                                loading={!!loadingIds[offer.id]}
                                emptyLabel={failedIds[offer.id] ? 'Нет превью' : '…'}
                                className="cf-crm-teaser__preview-box"
                            />
                            <span className="cf-crm-teaser__card-title">{offer.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ContentFactoryCrmTeaser;
