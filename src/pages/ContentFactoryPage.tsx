import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Eye,
    FileStack,
    GripVertical,
    Layers,
    Loader2,
    Plus,
    Send,
    X,
} from 'lucide-react';
import Header from '../components/Header';
import HtmlPreviewIframe from '../components/contentFactory/HtmlPreviewIframe';
import OfferPreviewThumb from '../components/contentFactory/OfferPreviewThumb';
import type { NavPage } from '../components/lk/lkNavigation';
import { useContentFactoryPreviewCache } from '../hooks/useContentFactoryPreviewCache';
import {
    agentLkApi,
    getContentFactoryErrorMessage,
    getContentFactoryErrorMessageAsync,
    type AgentPresentation,
    type ContentFactoryOfferDetail,
    type ContentFactoryOfferListItem,
} from '../api/agentLkApi';
import {
    downloadPdfBlob,
    openPdfBlobInNewTab,
    pdfBase64ToBlob,
} from '../utils/contentFactoryPdf';
import '../styles/content-factory.css';

interface ContentFactoryPageProps {
    onNavigate: (page: NavPage) => void;
}

type TabId = 'catalog' | 'deck' | 'saved';
type Screen = TabId | 'offer-preview' | 'presentation';

function formatOfferMeta(offer: ContentFactoryOfferListItem): string {
    const parts: string[] = [];
    if (offer.published_at) {
        parts.push(`Опубликован ${new Date(offer.published_at).toLocaleDateString('ru-RU')}`);
    }
    if (offer.cta_label) {
        parts.push(offer.cta_label);
    }
    return parts.filter(Boolean).join(' · ') || offer.base_template_id;
}

function statusLabel(status: AgentPresentation['status']): string {
    if (status === 'sent') return 'Отправлено';
    if (status === 'ready') return 'Готово';
    return 'Черновик';
}

function kindLabel(kind: string): string {
    const labels: Record<string, string> = {
        product: 'Продукт',
        insurance: 'Страхование',
        investment: 'Инвестиции',
        service: 'Сервис',
    };
    return labels[kind] ?? kind;
}

function kindAccentClass(kind: string): string {
    const accents: Record<string, string> = {
        product: 'cf-offer-card--product',
        insurance: 'cf-offer-card--insurance',
        investment: 'cf-offer-card--investment',
    };
    return accents[kind] ?? 'cf-offer-card--default';
}

const ContentFactoryPage: React.FC<ContentFactoryPageProps> = ({ onNavigate }) => {
    const [screen, setScreen] = useState<Screen>('catalog');
    const [offers, setOffers] = useState<ContentFactoryOfferListItem[]>([]);
    const [presentations, setPresentations] = useState<AgentPresentation[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [loadingPresentations, setLoadingPresentations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [deckOfferIds, setDeckOfferIds] = useState<number[]>([]);
    const [deckTitle, setDeckTitle] = useState('Новая презентация');
    const [recipientClientId, setRecipientClientId] = useState('');
    const [activePresentation, setActivePresentation] = useState<AgentPresentation | null>(null);
    const [previewOffer, setPreviewOffer] = useState<ContentFactoryOfferDetail | null>(null);
    const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

    const [savingDeck, setSavingDeck] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [emailDraftLoading, setEmailDraftLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [sendToEmail, setSendToEmail] = useState('');
    const [featuredOfferId, setFeaturedOfferId] = useState<number | null>(null);

    const offerMap = useMemo(() => {
        const map = new Map<number, ContentFactoryOfferListItem>();
        for (const offer of offers) map.set(offer.id, offer);
        return map;
    }, [offers]);

    const deckOffers = useMemo(
        () =>
            deckOfferIds
                .map((id) => offerMap.get(id))
                .filter((item): item is ContentFactoryOfferListItem => !!item),
        [deckOfferIds, offerMap],
    );

    const catalogOfferIds = useMemo(() => offers.map((offer) => offer.id), [offers]);
    const { cache: previewCache, loadingIds: previewLoadingIds, failedIds: previewFailedIds } =
        useContentFactoryPreviewCache(catalogOfferIds);
    const dashboardPreviewOffers = useMemo(() => offers.slice(0, 6), [offers]);

    const featuredOffer = useMemo(() => {
        if (featuredOfferId != null) {
            const picked = offerMap.get(featuredOfferId);
            if (picked) return picked;
        }
        return offers[0] ?? null;
    }, [featuredOfferId, offerMap, offers]);

    useEffect(() => {
        if (offers.length === 0) {
            setFeaturedOfferId(null);
            return;
        }
        if (featuredOfferId == null || !offerMap.has(featuredOfferId)) {
            setFeaturedOfferId(offers[0].id);
        }
    }, [offers, featuredOfferId, offerMap]);

    const loadCatalog = useCallback(async () => {
        setLoadingOffers(true);
        setError(null);
        try {
            const data = await agentLkApi.listContentFactoryOffers();
            setOffers(data);
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось загрузить каталог'));
        } finally {
            setLoadingOffers(false);
        }
    }, []);

    const loadPresentations = useCallback(async (silent = false) => {
        setLoadingPresentations(true);
        if (!silent) setError(null);
        try {
            const data = await agentLkApi.listContentFactoryPresentations();
            setPresentations(data);
        } catch (err) {
            if (!silent) {
                setError(getContentFactoryErrorMessage(err, 'Не удалось загрузить презентации'));
            }
        } finally {
            setLoadingPresentations(false);
        }
    }, []);

    useEffect(() => {
        void loadCatalog();
        void loadPresentations(true);
    }, [loadCatalog, loadPresentations]);

    useEffect(() => {
        if (screen === 'saved') {
            void loadPresentations();
        }
    }, [screen, loadPresentations]);

    const clearFeedback = () => {
        setError(null);
        setSuccess(null);
    };

    const startNewDeck = () => {
        clearFeedback();
        setActivePresentation(null);
        setDeckOfferIds([]);
        setDeckTitle('Новая презентация');
        setRecipientClientId('');
        setScreen('deck');
    };

    const addToDeck = (offerId: number) => {
        clearFeedback();
        setDeckOfferIds((prev) => (prev.includes(offerId) ? prev : [...prev, offerId]));
        setSuccess('Материал добавлен в презентацию');
    };

    const removeFromDeck = (offerId: number) => {
        setDeckOfferIds((prev) => prev.filter((id) => id !== offerId));
    };

    const moveDeckItem = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setDeckOfferIds((prev) => {
            const next = [...prev];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            return next;
        });
    };

    const openOfferPreview = async (offerId: number) => {
        clearFeedback();
        const listItem = offerMap.get(offerId);
        const cachedHtml = previewCache[offerId];
        if (listItem && cachedHtml) {
            setPreviewOffer({ ...listItem, cta_url_base: null, preview_html: cachedHtml });
        } else {
            setPreviewOffer(null);
        }
        setScreen('offer-preview');
        try {
            const detail = await agentLkApi.getContentFactoryOffer(offerId);
            setPreviewOffer(detail);
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось загрузить превью'));
            if (!cachedHtml) setScreen('catalog');
        }
    };

    const openPresentation = async (presentationId: number) => {
        clearFeedback();
        setActivePresentation(null);
        setPreviewSlideIndex(0);
        setScreen('presentation');
        try {
            const detail = await agentLkApi.getContentFactoryPresentation(presentationId);
            setActivePresentation(detail);
            setDeckTitle(detail.title);
            setDeckOfferIds(detail.offer_ids);
            setRecipientClientId(
                detail.recipient_client_id != null ? String(detail.recipient_client_id) : '',
            );
            setSendToEmail('');
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось открыть презентацию'));
            setScreen('saved');
        }
    };

    const saveDeck = async () => {
        if (deckOfferIds.length === 0) {
            setError('Добавьте хотя бы один материал в презентацию');
            return;
        }

        clearFeedback();
        setSavingDeck(true);
        const recipientId = recipientClientId.trim() ? Number(recipientClientId.trim()) : undefined;
        const payload = {
            title: deckTitle.trim() || 'Презентация',
            offer_ids: deckOfferIds,
            ...(recipientId && Number.isFinite(recipientId) ? { recipient_client_id: recipientId } : {}),
        };

        try {
            const saved = activePresentation
                ? await agentLkApi.patchContentFactoryPresentation(activePresentation.id, payload)
                : await agentLkApi.createContentFactoryPresentation(payload);
            setActivePresentation(saved);
            setDeckOfferIds(saved.offer_ids);
            setDeckTitle(saved.title);
            setSuccess(activePresentation ? 'Презентация обновлена' : 'Презентация сохранена');
            setScreen('presentation');
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось сохранить презентацию'));
        } finally {
            setSavingDeck(false);
        }
    };

    const handleGeneratePdf = async (downloadFile = false) => {
        if (!activePresentation) return;
        clearFeedback();
        setPdfLoading(true);
        try {
            if (downloadFile) {
                const blob = await agentLkApi.downloadContentFactoryPresentationPdf(activePresentation.id);
                downloadPdfBlob(blob, `${activePresentation.title || 'presentation'}.pdf`);
                setSuccess('PDF скачан');
            } else {
                const res = await agentLkApi.generateContentFactoryPresentationPdf(activePresentation.id);
                setActivePresentation(res.presentation);
                const blob = pdfBase64ToBlob(res.pdf_base64, res.content_type || 'application/pdf');
                const opened = openPdfBlobInNewTab(blob, `${activePresentation.title || 'presentation'}.pdf`);
                setSuccess(opened ? 'PDF сгенерирован' : 'PDF скачан (блокировщик вкладок)');
            }
        } catch (err) {
            setError(await getContentFactoryErrorMessageAsync(err, 'Не удалось сгенерировать PDF'));
        } finally {
            setPdfLoading(false);
        }
    };

    const handleEmailDraft = async () => {
        if (!activePresentation) return;
        clearFeedback();
        setEmailDraftLoading(true);
        try {
            const updated = await agentLkApi.createContentFactoryEmailDraft(activePresentation.id);
            setActivePresentation(updated);
            setSuccess('Черновик письма готов');
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось создать черновик письма'));
        } finally {
            setEmailDraftLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!activePresentation) return;
        clearFeedback();
        setSendLoading(true);
        try {
            const payload = sendToEmail.trim() ? { to: sendToEmail.trim() } : {};
            await agentLkApi.sendContentFactoryPresentation(activePresentation.id, payload);
            const refreshed = await agentLkApi.getContentFactoryPresentation(activePresentation.id);
            setActivePresentation(refreshed);
            setSuccess('Письмо отправлено');
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось отправить письмо'));
        } finally {
            setSendLoading(false);
        }
    };

    const saveEmailFields = async () => {
        if (!activePresentation) return;
        clearFeedback();
        try {
            const updated = await agentLkApi.patchContentFactoryPresentation(activePresentation.id, {
                email_subject: activePresentation.email_subject ?? '',
                email_body: activePresentation.email_body ?? '',
            });
            setActivePresentation(updated);
            setSuccess('Текст письма сохранён');
        } catch (err) {
            setError(getContentFactoryErrorMessage(err, 'Не удалось сохранить текст письма'));
        }
    };

    const renderHero = () => (
        <section className="cf-hero" aria-label="Материалы">
            <div className="cf-hero__content">
                <span className="cf-hero__eyebrow">Content Factory</span>
                <h1 className="cf-hero__title">Материалы для клиентов</h1>
                <p className="cf-hero__subtitle">
                    Готовые продуктовые листы: соберите презентацию, скачайте PDF или отправьте клиенту
                    на email.
                </p>
                <div className="cf-hero__meta">
                    <span className="cf-hero__chip">
                        {loadingOffers ? '…' : `${offers.length} в каталоге`}
                    </span>
                    {deckOfferIds.length > 0 ? (
                        <span className="cf-hero__chip cf-hero__chip--accent">
                            {deckOfferIds.length} в сборке
                        </span>
                    ) : null}
                    {presentations.length > 0 ? (
                        <span className="cf-hero__chip">
                            {presentations.length} сохранённых
                        </span>
                    ) : null}
                </div>
                <div className="cf-hero__actions">
                    <button type="button" className="cf-btn cf-btn--primary" onClick={startNewDeck}>
                        <Plus size={16} />
                        Новая презентация
                    </button>
                    {deckOfferIds.length > 0 ? (
                        <button
                            type="button"
                            className="cf-btn cf-btn--ghost"
                            onClick={() => {
                                clearFeedback();
                                setScreen('deck');
                            }}
                        >
                            <Layers size={16} />
                            Продолжить сборку
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="cf-btn cf-btn--ghost"
                            onClick={() => {
                                clearFeedback();
                                document.getElementById('cf-catalog')?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                });
                            }}
                        >
                            Смотреть каталог
                        </button>
                    )}
                </div>
            </div>

            <div className="cf-hero__preview-panel">
                <div className="cf-hero__preview-head">
                    <span className="cf-hero__preview-label">Живое превью</span>
                    {featuredOffer ? (
                        <span className="cf-hero__preview-name">{featuredOffer.title}</span>
                    ) : null}
                </div>

                {loadingOffers ? (
                    <div className="cf-hero__preview-box cf-hero__preview-box--state">
                        <Loader2 size={22} className="animate-spin" />
                        <span>Загружаем каталог…</span>
                    </div>
                ) : featuredOffer ? (
                    <>
                        <OfferPreviewThumb
                            title={featuredOffer.title}
                            html={previewCache[featuredOffer.id]}
                            loading={!!previewLoadingIds[featuredOffer.id]}
                            emptyLabel={
                                previewFailedIds[featuredOffer.id]
                                    ? 'Превью недоступно'
                                    : 'Загружаем HTML…'
                            }
                            className="cf-hero__preview-box"
                            onClick={() => void openOfferPreview(featuredOffer.id)}
                        />
                        <div className="cf-hero__preview-actions">
                            <button
                                type="button"
                                className="cf-btn cf-btn--primary"
                                onClick={() => void openOfferPreview(featuredOffer.id)}
                            >
                                <Eye size={15} />
                                Открыть
                            </button>
                            <button
                                type="button"
                                className="cf-btn cf-btn--secondary"
                                onClick={() => addToDeck(featuredOffer.id)}
                                disabled={deckOfferIds.includes(featuredOffer.id)}
                            >
                                {deckOfferIds.includes(featuredOffer.id) ? 'В сборке' : 'В презентацию'}
                            </button>
                        </div>
                        {dashboardPreviewOffers.length > 1 ? (
                            <div className="cf-hero__preview-picker" role="listbox" aria-label="Материалы">
                                {dashboardPreviewOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        role="option"
                                        aria-selected={featuredOffer.id === offer.id}
                                        className={`cf-hero__preview-pick${
                                            featuredOffer.id === offer.id
                                                ? ' cf-hero__preview-pick--active'
                                                : ''
                                        }`}
                                        onClick={() => setFeaturedOfferId(offer.id)}
                                    >
                                        {offer.title}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="cf-hero__preview-box cf-hero__preview-box--state">
                        <FileStack size={28} />
                        <strong>Каталог пока пуст</strong>
                        <span>Опубликованные материалы появятся здесь автоматически.</span>
                    </div>
                )}
            </div>
        </section>
    );

    const renderTabs = () => {
        if (screen === 'offer-preview' || screen === 'presentation') return null;
        const tabs: { id: TabId; label: string; badge?: number }[] = [
            { id: 'catalog', label: 'Каталог' },
            { id: 'deck', label: 'Конструктор', badge: deckOfferIds.length },
            { id: 'saved', label: 'Сохранённые' },
        ];
        return (
            <div className="cf-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`cf-tab${screen === tab.id ? ' cf-tab--active' : ''}`}
                        onClick={() => {
                            clearFeedback();
                            setScreen(tab.id);
                        }}
                    >
                        {tab.label}
                        {tab.badge ? ` (${tab.badge})` : ''}
                    </button>
                ))}
            </div>
        );
    };

    const renderCatalog = () => (
        <>
            <div className="cf-section-head" id="cf-catalog">
                <div>
                    <h2 className="cf-section-head__title">Каталог материалов</h2>
                    <p className="cf-section-head__subtitle">
                        Выберите листы для презентации — превью без utm, PDF соберёт бэкенд.
                    </p>
                </div>
                {deckOfferIds.length > 0 ? (
                    <button
                        type="button"
                        className="cf-btn cf-btn--primary"
                        onClick={() => setScreen('deck')}
                    >
                        <Send size={15} />
                        В конструктор ({deckOfferIds.length})
                    </button>
                ) : null}
            </div>

            {loadingOffers ? (
                <div className="cf-loading">
                    <Loader2 size={18} className="animate-spin" />
                    Загрузка каталога…
                </div>
            ) : offers.length === 0 ? (
                <div className="cf-empty">
                    <FileStack size={32} />
                    <p>Опубликованных материалов пока нет.</p>
                </div>
            ) : (
                <div className="cf-grid">
                    {offers.map((offer) => (
                        <article
                            key={offer.id}
                            className={`cf-offer-card ${kindAccentClass(offer.kind)}${
                                deckOfferIds.includes(offer.id) ? ' cf-offer-card--selected' : ''
                            }`}
                        >
                            <div
                                className="cf-offer-card__cover"
                                onClick={() => void openOfferPreview(offer.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        void openOfferPreview(offer.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Превью: ${offer.title}`}
                            >
                                <span className="cf-offer-card__pages">{offer.page_count} стр.</span>
                                <OfferPreviewThumb
                                    title={offer.title}
                                    html={previewCache[offer.id]}
                                    loading={!!previewLoadingIds[offer.id]}
                                    emptyLabel={
                                        previewFailedIds[offer.id]
                                            ? 'Нет preview_html'
                                            : 'Загрузка превью…'
                                    }
                                    className="cf-offer-card__thumb"
                                />
                            </div>
                            <div className="cf-offer-card__body">
                                <div className="cf-offer-card__top">
                                    <span className="cf-offer-card__kind">{kindLabel(offer.kind)}</span>
                                    {deckOfferIds.includes(offer.id) ? (
                                        <span className="cf-offer-card__picked">В deck</span>
                                    ) : null}
                                </div>
                                <h3 className="cf-offer-card__title">{offer.title}</h3>
                                <div className="cf-offer-card__meta">{formatOfferMeta(offer)}</div>
                                {offer.brief ? (
                                    <p className="cf-offer-card__brief">{offer.brief}</p>
                                ) : null}
                                <div className="cf-offer-card__actions">
                                    <button
                                        type="button"
                                        className="cf-btn cf-btn--ghost"
                                        onClick={() => void openOfferPreview(offer.id)}
                                    >
                                        <Eye size={14} />
                                        Превью
                                    </button>
                                    <button
                                        type="button"
                                        className="cf-btn cf-btn--primary"
                                        onClick={() => addToDeck(offer.id)}
                                        disabled={deckOfferIds.includes(offer.id)}
                                    >
                                        {deckOfferIds.includes(offer.id) ? 'Добавлено' : 'В презентацию'}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );

    const renderDeckBuilder = () => (
        <div className="cf-deck-layout">
            <div className="cf-deck-panel">
                <h2 className="cf-deck-panel__title">Состав и порядок</h2>
                {deckOffers.length === 0 ? (
                    <p className="cf-deck-panel__empty">
                        Выберите материалы в каталоге и вернитесь сюда — порядок меняется
                        перетаскиванием.
                    </p>
                ) : (
                    deckOffers.map((offer, index) => (
                        <div
                            key={offer.id}
                            className={`cf-deck-item${dragOverIndex === index ? ' cf-deck-item--drag-over' : ''}`}
                            draggable
                            onDragStart={() => setDragSourceIndex(index)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverIndex(index);
                            }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (dragSourceIndex != null) moveDeckItem(dragSourceIndex, index);
                                setDragSourceIndex(null);
                                setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                                setDragSourceIndex(null);
                                setDragOverIndex(null);
                            }}
                        >
                            <span className="cf-deck-item__handle" aria-hidden>
                                <GripVertical size={16} />
                            </span>
                            <span className="cf-deck-item__title">{offer.title}</span>
                            <button
                                type="button"
                                className="cf-btn cf-btn--ghost cf-btn--icon"
                                aria-label="Убрать из сборки"
                                onClick={() => removeFromDeck(offer.id)}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div>
                <div className="cf-field">
                    <label htmlFor="cf-deck-title">Название презентации</label>
                    <input
                        id="cf-deck-title"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        placeholder="Подборка для клиента"
                    />
                </div>
                <div className="cf-field">
                    <label htmlFor="cf-recipient-id">ID клиента (опционально)</label>
                    <input
                        id="cf-recipient-id"
                        value={recipientClientId}
                        onChange={(e) => setRecipientClientId(e.target.value)}
                        inputMode="numeric"
                        placeholder="456"
                    />
                </div>
                <div className="cf-toolbar">
                    <button
                        type="button"
                        className="cf-btn cf-btn--primary"
                        disabled={savingDeck || deckOfferIds.length === 0}
                        onClick={() => void saveDeck()}
                    >
                        {savingDeck ? 'Сохранение…' : activePresentation ? 'Обновить' : 'Сохранить презентацию'}
                    </button>
                    {activePresentation ? (
                        <button
                            type="button"
                            className="cf-btn cf-btn--secondary"
                            onClick={() => {
                                setPreviewSlideIndex(0);
                                setScreen('presentation');
                            }}
                        >
                            Открыть презентацию
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderSavedList = () => (
        <>
            <div className="cf-section-head">
                <div>
                    <h2 className="cf-section-head__title">Сохранённые презентации</h2>
                    <p className="cf-section-head__subtitle">
                        Черновики и отправленные подборки — откройте, чтобы скачать PDF или написать клиенту.
                    </p>
                </div>
                <button type="button" className="cf-btn cf-btn--primary" onClick={startNewDeck}>
                    <Plus size={15} />
                    Новая
                </button>
            </div>
            {loadingPresentations ? (
                <div className="cf-loading">
                    <Loader2 size={18} className="animate-spin" />
                    Загрузка…
                </div>
            ) : presentations.length === 0 ? (
                <div className="cf-empty">
                    <FileStack size={28} />
                    <p>Сохранённых презентаций пока нет.</p>
                    <button type="button" className="cf-btn cf-btn--primary" onClick={startNewDeck}>
                        Собрать первую
                    </button>
                </div>
            ) : (
                <div className="cf-list">
                    {presentations.map((item) => (
                        <div key={item.id} className="cf-list-row">
                            <div>
                                <div className="cf-list-row__title">{item.title}</div>
                                <div className="cf-list-row__meta">
                                    {item.offer_ids.length} материал(ов)
                                    {item.updated_at
                                        ? ` · ${new Date(item.updated_at).toLocaleString('ru-RU')}`
                                        : ''}
                                </div>
                            </div>
                            <div className="cf-list-row__actions">
                                <span
                                    className={`cf-status${
                                        item.status === 'sent' ? ' cf-status--sent' : ''
                                    }`}
                                >
                                    {statusLabel(item.status)}
                                </span>
                                <button
                                    type="button"
                                    className="cf-btn cf-btn--secondary"
                                    onClick={() => void openPresentation(item.id)}
                                >
                                    Открыть
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    const renderOfferPreview = () => (
        <>
            <button
                type="button"
                className="cf-back-link"
                onClick={() => {
                    setPreviewOffer(null);
                    setScreen('catalog');
                }}
            >
                <ArrowLeft size={16} />
                Назад к каталогу
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
                {previewOffer?.title ?? 'Превью материала'}
            </h2>
            {!previewOffer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                    <Loader2 size={18} />
                    Загрузка превью…
                </div>
            ) : (
                <>
                    <HtmlPreviewIframe html={previewOffer.preview_html} title={previewOffer.title} />
                    <div className="cf-toolbar">
                        <button
                            type="button"
                            className="cf-btn cf-btn--primary"
                            onClick={() => {
                                addToDeck(previewOffer.id);
                                setScreen('deck');
                            }}
                        >
                            Добавить в презентацию
                        </button>
                    </div>
                </>
            )}
        </>
    );

    const renderPresentation = () => {
        const slides = activePresentation?.offers ?? [];
        const activeSlide = slides[previewSlideIndex];

        return (
            <>
                <button
                    type="button"
                    className="cf-back-link"
                    onClick={() => setScreen('saved')}
                >
                    <ArrowLeft size={16} />
                    К списку презентаций
                </button>

                {!activePresentation ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                        <Loader2 size={18} />
                        Загрузка…
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{activePresentation.title}</h2>
                            <span className={`cf-status${activePresentation.status === 'sent' ? ' cf-status--sent' : ''}`}>
                                {statusLabel(activePresentation.status)}
                            </span>
                        </div>

                        {slides.length > 0 ? (
                            <>
                                <div className="cf-slide-tabs">
                                    {slides.map((slide, index) => (
                                        <button
                                            key={slide.id}
                                            type="button"
                                            className={`cf-slide-tab${previewSlideIndex === index ? ' cf-slide-tab--active' : ''}`}
                                            onClick={() => setPreviewSlideIndex(index)}
                                        >
                                            {index + 1}. {slide.title}
                                        </button>
                                    ))}
                                </div>
                                <HtmlPreviewIframe
                                    html={activeSlide?.preview_html}
                                    title={activeSlide?.title ?? activePresentation.title}
                                />
                            </>
                        ) : (
                            <p style={{ color: '#6b7280' }}>Нет слайдов для превью.</p>
                        )}

                        <div className="cf-toolbar">
                            <button
                                type="button"
                                className="cf-btn cf-btn--primary"
                                disabled={pdfLoading}
                                onClick={() => void handleGeneratePdf(false)}
                            >
                                {pdfLoading ? 'PDF…' : 'Открыть PDF'}
                            </button>
                            <button
                                type="button"
                                className="cf-btn cf-btn--secondary"
                                disabled={pdfLoading}
                                onClick={() => void handleGeneratePdf(true)}
                            >
                                Скачать PDF
                            </button>
                            <button
                                type="button"
                                className="cf-btn cf-btn--ghost"
                                onClick={() => setScreen('deck')}
                            >
                                Редактировать состав
                            </button>
                        </div>

                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Email клиенту</h3>
                            <div className="cf-field">
                                <label htmlFor="cf-send-to">Email получателя (если не задан client_id)</label>
                                <input
                                    id="cf-send-to"
                                    type="email"
                                    value={sendToEmail}
                                    onChange={(e) => setSendToEmail(e.target.value)}
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div className="cf-field">
                                <label htmlFor="cf-email-subject">Тема</label>
                                <input
                                    id="cf-email-subject"
                                    value={activePresentation.email_subject ?? ''}
                                    onChange={(e) =>
                                        setActivePresentation({
                                            ...activePresentation,
                                            email_subject: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="cf-field">
                                <label htmlFor="cf-email-body">Текст письма</label>
                                <textarea
                                    id="cf-email-body"
                                    value={activePresentation.email_body ?? ''}
                                    onChange={(e) =>
                                        setActivePresentation({
                                            ...activePresentation,
                                            email_body: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="cf-toolbar">
                                <button
                                    type="button"
                                    className="cf-btn cf-btn--ghost"
                                    disabled={emailDraftLoading}
                                    onClick={() => void handleEmailDraft()}
                                >
                                    {emailDraftLoading ? 'Генерация…' : 'Сгенерировать черновик'}
                                </button>
                                <button
                                    type="button"
                                    className="cf-btn cf-btn--secondary"
                                    onClick={() => void saveEmailFields()}
                                >
                                    Сохранить текст
                                </button>
                                <button
                                    type="button"
                                    className="cf-btn cf-btn--primary"
                                    disabled={sendLoading}
                                    onClick={() => void handleSendEmail()}
                                >
                                    {sendLoading ? 'Отправка…' : 'Отправить'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    };

    return (
        <Header activePage="content-factory" onNavigate={onNavigate}>
            <main className="lk-page-main cf-page" style={{ maxWidth: '1200px' }}>
                {screen === 'catalog' ? renderHero() : null}

                {error ? (
                    <p className="cf-banner cf-banner--error" role="alert">
                        {error}
                    </p>
                ) : null}
                {success ? (
                    <p className="cf-banner cf-banner--success" role="status">
                        {success}
                    </p>
                ) : null}

                {renderTabs()}

                <div className="lk-card cf-panel">
                    {screen === 'deck' ? (
                        <div className="cf-panel-head">
                            <h1 className="cf-panel-head__title">Конструктор презентации</h1>
                            <p className="cf-panel-head__subtitle">
                                Расставьте листы в нужном порядке, сохраните и соберите PDF.
                            </p>
                        </div>
                    ) : null}

                    {screen === 'catalog' && renderCatalog()}
                    {screen === 'deck' && renderDeckBuilder()}
                    {screen === 'saved' && renderSavedList()}
                    {screen === 'offer-preview' && renderOfferPreview()}
                    {screen === 'presentation' && renderPresentation()}
                </div>
            </main>
        </Header>
    );
};

export default ContentFactoryPage;
