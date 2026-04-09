import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { agentLkApi } from '../api/agentLkApi';

type TocItem = {
    id?: string | number;
    title?: string;
    page_start?: number;
    page_count?: number;
    order?: number;
};

const HtmlReportPreviewPage: React.FC = () => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = React.useState<string | null>(null);
    const [htmlFallback, setHtmlFallback] = React.useState<string>('');
    const [pages, setPages] = React.useState<string[]>([]);
    const [toc, setToc] = React.useState<TocItem[]>([]);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [showAllPages, setShowAllPages] = React.useState(true);
    const [pageHeights, setPageHeights] = React.useState<Record<number, number>>({});
    const [singlePageHeight, setSinglePageHeight] = React.useState(900);

    React.useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams(window.location.search);
                const includeCover = !(params.get('includeCover') === '0' || params.get('includeCover') === 'false');
                const includeSummary = !(params.get('includeSummary') === '0' || params.get('includeSummary') === 'false');
                const goalTypesRaw = params.get('goalTypes');
                const goalTypes = goalTypesRaw
                    ? goalTypesRaw.split(',').map((x) => x.trim()).filter(Boolean)
                    : undefined;

                const response = await agentLkApi.getPlanReportHtmlPreview({
                    includeCover,
                    includeSummary,
                    goalTypes,
                });

                if (cancelled) return;

                const responsePages = Array.isArray(response.pages)
                    ? response.pages.filter((p) => typeof p === 'string' && p.trim().length > 0)
                    : [];
                const responseToc = Array.isArray(response.toc) ? (response.toc as TocItem[]) : [];
                const sortedToc = [...responseToc].sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));

                setPages(responsePages);
                setHtmlFallback(String(response.html || ''));
                setToc(sortedToc);
                setGeneratedAt(response.generated_at || null);
                setActiveIndex(0);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.response?.data?.message || e?.message || 'Не удалось загрузить HTML-отчет.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    const measureIframeHeight = React.useCallback((iframe: HTMLIFrameElement | null, pageIndex?: number) => {
        if (!iframe) return;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;
            const bodyHeight = doc.body?.scrollHeight || 0;
            const docHeight = doc.documentElement?.scrollHeight || 0;
            const nextHeight = Math.max(bodyHeight, docHeight, 600);
            if (pageIndex != null) {
                setPageHeights((prev) => {
                    if (prev[pageIndex] === nextHeight) return prev;
                    return { ...prev, [pageIndex]: nextHeight };
                });
            } else {
                setSinglePageHeight((prev) => (prev === nextHeight ? prev : nextHeight));
            }
        } catch {
            // ignore cross-doc edge cases
        }
    }, []);

    const pageList = pages.length > 0 ? pages : (htmlFallback ? [htmlFallback] : []);
    const canGoBack = activeIndex > 0;
    const canGoNext = activeIndex < pageList.length - 1;
    const activeToc = toc[activeIndex] || null;
    const activeHtml = pageList[activeIndex] || '';

    const formatGeneratedAt = (value: string | null) => {
        if (!value) return null;
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return null;
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dt);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '16px' }}>
            <div style={{
                width: 'min(1920px, 98vw)',
                height: '94vh',
                margin: '0 auto',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateRows: '72px 1fr 72px',
                boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
            }}>
                <div style={{ borderBottom: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>HTML-превью отчета</div>
                        {formatGeneratedAt(generatedAt) && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                Сформирован: {formatGeneratedAt(generatedAt)}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => setShowAllPages((prev) => !prev)}
                            style={{
                                border: '1px solid #d1d5db',
                                background: '#fff',
                                color: '#374151',
                                borderRadius: '999px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {showAllPages ? 'Показать по страницам' : 'Показать все страницы'}
                        </button>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {showAllPages
                                ? `Весь отчет (${pageList.length} стр.)`
                                : (pageList.length > 1 ? `Страница ${activeIndex + 1} из ${pageList.length}` : 'Одна HTML-страница')}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 22vw) 1fr', minHeight: 0 }}>
                    <aside style={{ borderRight: '1px solid #eee', padding: '14px', overflowY: 'auto', minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', marginBottom: '10px' }}>ОГЛАВЛЕНИЕ</div>
                        {toc.length === 0 ? (
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Оглавление не пришло, листай по страницам.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {toc.map((item, index) => (
                                    <button
                                        key={item.id ?? index}
                                        onClick={() => {
                                            const nextIndex = Math.max(0, Math.min(index, pageList.length - 1));
                                            setActiveIndex(nextIndex);
                                            if (showAllPages) {
                                                const element = document.getElementById(`html-report-page-${nextIndex}`);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }
                                        }}
                                        style={{
                                            borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: index === activeIndex ? 'var(--primary)' : '#e5e7eb',
                                            background: index === activeIndex ? 'rgba(194,24,91,0.08)' : '#fff',
                                            color: index === activeIndex ? 'var(--primary)' : '#111827',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ fontSize: '14px', marginBottom: '3px' }}>{index + 1}. {item.title || 'Раздел'}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            стр. {item.page_start ?? index + 1}
                                            {item.page_count ? ` • ${item.page_count} стр.` : ''}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    <main style={{ background: '#f9fafb', padding: '14px', minHeight: 0 }}>
                        <div style={{ height: '100%', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff', position: 'relative' }}>
                            {loading && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(255,255,255,0.92)', color: '#4b5563' }}>
                                    <Loader2 className="animate-spin" size={40} color="var(--primary, #c2185b)" strokeWidth={2.2} />
                                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Гружу HTML-превью…</div>
                                </div>
                            )}
                            {!loading && error && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', textAlign: 'center', padding: '16px' }}>
                                    {error}
                                </div>
                            )}
                            {!loading && !error && showAllPages && pageList.length > 0 && (
                                <div style={{ height: '100%', overflowY: 'auto', padding: '16px', background: '#f3f4f6' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {pageList.map((pageHtml, index) => (
                                            <div key={index} id={`html-report-page-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                                    Страница {index + 1}
                                                </div>
                                                <iframe
                                                    title={`html-report-page-${index + 1}`}
                                                    srcDoc={pageHtml}
                                                    onLoad={(e) => {
                                                        const frame = e.currentTarget;
                                                        measureIframeHeight(frame, index);
                                                        const onResize = () => measureIframeHeight(frame, index);
                                                        frame.contentWindow?.addEventListener('resize', onResize);
                                                        setTimeout(() => measureIframeHeight(frame, index), 50);
                                                        setTimeout(() => measureIframeHeight(frame, index), 250);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: `${pageHeights[index] || 900}px`,
                                                        border: 'none',
                                                        display: 'block'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!loading && !error && !showAllPages && activeHtml && (
                                <iframe
                                    title={activeToc?.title || `html-report-page-${activeIndex + 1}`}
                                    srcDoc={activeHtml}
                                    onLoad={(e) => {
                                        const frame = e.currentTarget;
                                        measureIframeHeight(frame);
                                        const onResize = () => measureIframeHeight(frame);
                                        frame.contentWindow?.addEventListener('resize', onResize);
                                        setTimeout(() => measureIframeHeight(frame), 50);
                                        setTimeout(() => measureIframeHeight(frame), 250);
                                    }}
                                    style={{ width: '100%', height: `${singlePageHeight}px`, border: 'none' }}
                                />
                            )}
                            {!loading && !error && !activeHtml && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                                    Пустой ответ HTML отчета
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                <div style={{ borderTop: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={showAllPages || !canGoBack || loading}
                        style={{
                            border: '1px solid #ddd',
                            background: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: !showAllPages && canGoBack && !loading ? 'pointer' : 'not-allowed',
                            opacity: !showAllPages && canGoBack && !loading ? 1 : 0.5,
                        }}
                    >
                        <ChevronLeft size={16} />
                        Назад
                    </button>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        {showAllPages
                            ? 'Показаны все страницы отчета'
                            : (activeToc ? `Раздел: ${activeToc.title || '—'}` : `Страница ${activeIndex + 1} из ${Math.max(1, pageList.length)}`)}
                    </div>
                    <button
                        onClick={() => setActiveIndex((prev) => Math.min(prev + 1, pageList.length - 1))}
                        disabled={showAllPages || !canGoNext || loading}
                        style={{
                            border: 'none',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: !showAllPages && canGoNext && !loading ? 'pointer' : 'not-allowed',
                            opacity: !showAllPages && canGoNext && !loading ? 1 : 0.5,
                        }}
                    >
                        Далее
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HtmlReportPreviewPage;
