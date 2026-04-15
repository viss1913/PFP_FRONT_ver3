import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { clientApi, type ReportTocItem } from '../api/clientApi';
import { API_BASE_WITH_API } from '../api/config';

interface ReportPreviewModalProps {
    isOpen: boolean;
    clientId: number | null;
    onClose: () => void;
}

type ReportState = {
    toc: ReportTocItem[];
    generatedAt: string | null;
    metaLoading: boolean;
    pdfLoading: boolean;
    pdfProgress: number | null;
    error: string | null;
};

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) return 'Сессия истекла. Войди заново.';
        if (status === 403) return 'Нет доступа к отчету.';
        if (status === 404) return 'Отчет не найден.';
        if (status === 500) return 'Ошибка генерации отчета. Попробуй позже.';
        if (error.message) return error.message;
    }
    return 'Не удалось выполнить запрос.';
};

const toPdfObjectBlob = (blob: Blob) =>
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });

const createInitialReportState = (): ReportState => ({
    toc: [],
    generatedAt: null,
    metaLoading: false,
    pdfLoading: false,
    pdfProgress: null,
    error: null,
});

const PDF_URL_POLL_INTERVAL_MS = 2500;
const PDF_URL_POLL_MAX_ATTEMPTS = 60;

/**
 * pdf_url с бэка часто приходит как путь вида `.dev/pdf-reports/...` — это не URL с корня домена,
 * а путь относительно префикса /api; иначе запрос уходит на хост/.dev/... без Bearer.
 */
const resolvePdfFetchUrl = (pdfUrl: string): string => {
    const t = pdfUrl.trim();
    if (/^https?:\/\//i.test(t)) return t;
    const path = t.replace(/^\.\/+/, '').replace(/^\/+/, '');
    const base = API_BASE_WITH_API.replace(/\/$/, '');
    return `${base}/${path}`;
};

/** Маленький JSON с ошибкой вместо PDF (часто 200 + тело { message }). */
const readPdfBlobErrorMessage = async (blob: Blob): Promise<string | null> => {
    if (blob.size >= 4096) return null;
    const peek = await blob.slice(0, 8).text();
    if (!peek.trimStart().startsWith('{')) return null;
    const text = await blob.text();
    try {
        const j = JSON.parse(text) as { message?: string; error?: string };
        if (j.message) return j.message;
        if (j.error) return j.error;
    } catch {
        /* ignore */
    }
    return 'Не удалось скачать PDF.';
};

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

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ isOpen, clientId, onClose }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [reportState, setReportState] = useState<ReportState>(createInitialReportState);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const pdfBlobUrlRef = useRef<string | null>(null);

    const revokePdfBlobUrl = () => {
        const u = pdfBlobUrlRef.current;
        if (u) {
            URL.revokeObjectURL(u);
            pdfBlobUrlRef.current = null;
        }
        setPdfBlobUrl(null);
    };

    const canGoBack = activeIndex > 0;
    const canGoNext = activeIndex < reportState.toc.length - 1;
    const activeTocItem = reportState.toc[activeIndex] || null;
    const modalTitle = useMemo(() => `Отчет по клиенту #${clientId ?? ''}`.trim(), [clientId]);
    const generatedAtLabel = useMemo(() => formatGeneratedAt(reportState.generatedAt), [reportState.generatedAt]);

    /** Без оглавления или с кривыми page_start всё равно показываем весь PDF. */
    const pdfIframeSrc = useMemo(() => {
        if (!pdfBlobUrl) return null;
        const start = activeTocItem?.page_start;
        if (start != null && Number(start) > 0) return `${pdfBlobUrl}#page=${start}`;
        return pdfBlobUrl;
    }, [pdfBlobUrl, activeTocItem]);

    useEffect(() => {
        if (!isOpen || !clientId) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            revokePdfBlobUrl();
            return;
        }
        setActiveIndex(0);
        setReportState(createInitialReportState());
        revokePdfBlobUrl();
    }, [isOpen, clientId]);

    useEffect(() => {
        if (!isOpen || clientId == null) return;

        let cancelled = false;
        revokePdfBlobUrl();

        const run = async () => {
            setReportState({
                ...createInitialReportState(),
                metaLoading: true,
                error: null,
            });

            const waitNextPoll = async () =>
                new Promise<void>((resolve) => {
                    window.setTimeout(resolve, PDF_URL_POLL_INTERVAL_MS);
                });

            const onDlProgress = (loaded: number, total?: number) => {
                if (cancelled) return;
                if (total && total > 0) {
                    const pct = Math.min(100, Math.round((loaded / total) * 100));
                    setReportState((prev) => ({ ...prev, pdfProgress: pct }));
                } else {
                    setReportState((prev) => ({ ...prev, pdfProgress: null }));
                }
            };

            const tryLoadBlobByPdfUrl = async (remotePdfUrl: string, allowPdfEndpointFallback: boolean): Promise<Blob | null> => {
                const fetchUrl = resolvePdfFetchUrl(remotePdfUrl);
                try {
                    const blob = await clientApi.fetchReportPdfBlobFromUrl(fetchUrl, onDlProgress);
                    const jsonErr = await readPdfBlobErrorMessage(blob);
                    if (!jsonErr) return blob;
                } catch {
                    /* ignore */
                }
                if (!allowPdfEndpointFallback) return null;
                return clientApi.getReportPdfBlob(clientId, { includeCover: 1, includeSummary: 1 }, onDlProgress);
            };

            let attempts = 0;
            let lastLoadedRemoteUrl: string | null = null;

            while (!cancelled) {
                let meta: Awaited<ReturnType<typeof clientApi.getAgentReportPdfUrl>>;
                try {
                    meta = await clientApi.getAgentReportPdfUrl(clientId);
                } catch (error) {
                    if (cancelled) return;
                    setReportState((prev) => ({
                        ...prev,
                        metaLoading: false,
                        pdfLoading: false,
                        pdfProgress: null,
                        error: getErrorMessage(error),
                    }));
                    return;
                }

                if (cancelled) return;

                const sortedToc = [...(meta.toc || [])].sort((a, b) => a.order - b.order);
                const remotePdfUrl = meta.pdf_url?.trim() || '';
                const status = String(meta.status || 'ready').toLowerCase();
                const isProcessing = status === 'processing';
                const isReady = status === 'ready';

                setReportState((prev) => ({
                    ...prev,
                    toc: sortedToc,
                    generatedAt: meta.generated_at || null,
                    metaLoading: false,
                    error: null,
                }));

                const shouldRefreshBlob =
                    Boolean(remotePdfUrl) &&
                    (isReady || !pdfBlobUrlRef.current || remotePdfUrl !== lastLoadedRemoteUrl);

                if (shouldRefreshBlob) {
                    setReportState((prev) => ({ ...prev, pdfLoading: true, pdfProgress: null }));
                    const blob = await tryLoadBlobByPdfUrl(remotePdfUrl, isReady);
                    if (cancelled) return;

                    if (blob) {
                        const jsonErr = await readPdfBlobErrorMessage(blob);
                        if (jsonErr) {
                            if (isReady) {
                                setReportState((prev) => ({
                                    ...prev,
                                    pdfLoading: false,
                                    pdfProgress: null,
                                    error: jsonErr,
                                }));
                                return;
                            }
                        } else {
                            revokePdfBlobUrl();
                            const objectUrl = URL.createObjectURL(toPdfObjectBlob(blob));
                            pdfBlobUrlRef.current = objectUrl;
                            setPdfBlobUrl(objectUrl);
                            lastLoadedRemoteUrl = remotePdfUrl;
                        }
                    }

                    setReportState((prev) => ({ ...prev, pdfLoading: false, pdfProgress: null }));
                }

                if (isReady) {
                    if (!remotePdfUrl && !pdfBlobUrlRef.current) {
                        setReportState((prev) => ({
                            ...prev,
                            pdfLoading: false,
                            pdfProgress: null,
                            error: 'Сервер не вернул ссылку на PDF.',
                        }));
                    }
                    return;
                }

                if (!isProcessing) {
                    if (!pdfBlobUrlRef.current) {
                        setReportState((prev) => ({
                            ...prev,
                            pdfLoading: false,
                            pdfProgress: null,
                            error: 'Неизвестный статус генерации PDF.',
                        }));
                    }
                    return;
                }

                attempts += 1;
                if (attempts >= PDF_URL_POLL_MAX_ATTEMPTS) {
                    setReportState((prev) => ({
                        ...prev,
                        pdfLoading: false,
                        pdfProgress: null,
                        error: 'PDF всё ещё генерируется. Попробуй открыть превью чуть позже.',
                    }));
                    return;
                }

                await waitNextPoll();
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [isOpen, clientId]);

    useEffect(() => {
        return () => {
            revokePdfBlobUrl();
        };
    }, []);

    const loadingLocksNav = reportState.metaLoading || reportState.pdfLoading;

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (loadingLocksNav) return;
            if (event.key === 'ArrowLeft' && canGoBack) setActiveIndex((prev) => prev - 1);
            if (event.key === 'ArrowRight' && canGoNext) setActiveIndex((prev) => prev + 1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose, canGoBack, canGoNext, loadingLocksNav]);

    const handleDownloadPdf = () => {
        if (!pdfBlobUrl || clientId == null) return;
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = `financial_plan_${clientId}.pdf`;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleOpenPdfNewTab = () => {
        if (!pdfBlobUrl) return;
        window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 5000,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
            }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: 'min(1920px, 98vw)',
                    height: '96vh',
                    maxHeight: '96vh',
                    background: '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateRows: '72px 1fr 72px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
                }}
            >
                <div style={{ borderBottom: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>{modalTitle}</div>
                        {generatedAtLabel && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                Сформирован: {generatedAtLabel}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={handleOpenPdfNewTab}
                            disabled={!pdfBlobUrl || reportState.metaLoading || reportState.pdfLoading}
                            style={{
                                border: '1px solid #d1d5db',
                                background: '#fff',
                                color: '#374151',
                                borderRadius: '999px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor:
                                    pdfBlobUrl && !reportState.metaLoading && !reportState.pdfLoading
                                        ? 'pointer'
                                        : 'not-allowed',
                                opacity:
                                    pdfBlobUrl && !reportState.metaLoading && !reportState.pdfLoading ? 1 : 0.75,
                            }}
                        >
                            В новой вкладке
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={!pdfBlobUrl || reportState.metaLoading || reportState.pdfLoading}
                            style={{
                                border: 'none',
                                background: 'var(--primary)',
                                color: '#fff',
                                borderRadius: '999px',
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor:
                                    pdfBlobUrl && !reportState.metaLoading && !reportState.pdfLoading
                                        ? 'pointer'
                                        : 'not-allowed',
                                opacity:
                                    pdfBlobUrl && !reportState.metaLoading && !reportState.pdfLoading ? 1 : 0.75,
                            }}
                        >
                            <Download size={16} />
                            Скачать PDF
                        </button>
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#666', padding: 8 }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 22vw) 1fr', minHeight: 0 }}>
                    <aside style={{ borderRight: '1px solid #eee', padding: '14px', overflowY: 'auto', minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.04em', marginBottom: '10px' }}>ОГЛАВЛЕНИЕ</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reportState.toc.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveIndex(index)}
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
                                    <div style={{ fontSize: '14px', marginBottom: '3px' }}>{index + 1}. {item.title}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>стр. {item.page_start} • {item.page_count} стр.</div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <main style={{ background: '#f9fafb', padding: '14px', minHeight: 0 }}>
                        <div style={{ height: '100%', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff', position: 'relative' }}>
                            {(reportState.metaLoading || reportState.pdfLoading) && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '16px',
                                        background: 'rgba(255,255,255,0.92)',
                                        color: '#4b5563',
                                        padding: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Loader2 className="animate-spin" size={40} color="var(--primary, #c2185b)" strokeWidth={2.2} />
                                    <div style={{ fontSize: '16px', fontWeight: 600, maxWidth: '360px', lineHeight: 1.45 }}>
                                        {reportState.metaLoading
                                            ? 'Готовлю отчёт и ссылку…'
                                            : 'Качаю PDF — если файл большой, подожди чутка'}
                                    </div>
                                    {reportState.pdfLoading && reportState.pdfProgress != null && (
                                        <div style={{ width: 'min(360px, 80%)', height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${reportState.pdfProgress}%`,
                                                    height: '100%',
                                                    background: 'var(--primary, #c2185b)',
                                                    borderRadius: '999px',
                                                    transition: 'width 0.15s ease-out',
                                                }}
                                            />
                                        </div>
                                    )}
                                    {reportState.pdfLoading && reportState.pdfProgress != null && (
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{reportState.pdfProgress}%</div>
                                    )}
                                    {reportState.pdfLoading && reportState.pdfProgress == null && (
                                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>размер заранее неизвестен — качаем потоком</div>
                                    )}
                                </div>
                            )}

                            {!reportState.metaLoading && !reportState.pdfLoading && reportState.error && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', textAlign: 'center', padding: '16px' }}>
                                    {reportState.error}
                                </div>
                            )}

                            {!reportState.metaLoading && !reportState.pdfLoading && !reportState.error && pdfIframeSrc && (
                                <iframe
                                    title={activeTocItem ? `report-page-${activeTocItem.id}` : 'report-pdf'}
                                    src={pdfIframeSrc}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            )}

                            {!reportState.metaLoading && !reportState.pdfLoading && !reportState.error && !pdfIframeSrc && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6b7280' }}>
                                    <FileText size={16} />
                                    Нет данных отчета
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                <div style={{ borderTop: '1px solid #eee', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={!canGoBack || reportState.metaLoading || reportState.pdfLoading}
                        style={{
                            border: '1px solid #ddd',
                            background: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: canGoBack && !reportState.metaLoading && !reportState.pdfLoading ? 'pointer' : 'not-allowed',
                            opacity: canGoBack && !reportState.metaLoading && !reportState.pdfLoading ? 1 : 0.5,
                        }}
                    >
                        <ChevronLeft size={16} />
                        Назад
                    </button>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        {reportState.toc.length === 0 && pdfBlobUrl
                            ? 'Оглавление пустое — показан весь PDF'
                            : activeTocItem
                              ? `Раздел ${activeIndex + 1} из ${reportState.toc.length} · стр. ${activeTocItem.page_start}`
                              : 'Разделы не загружены'}
                    </div>
                    <button
                        onClick={() => setActiveIndex((prev) => Math.min(prev + 1, reportState.toc.length - 1))}
                        disabled={!canGoNext || reportState.metaLoading || reportState.pdfLoading}
                        style={{
                            border: 'none',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: canGoNext && !reportState.metaLoading && !reportState.pdfLoading ? 'pointer' : 'not-allowed',
                            opacity: canGoNext && !reportState.metaLoading && !reportState.pdfLoading ? 1 : 0.5,
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

export default ReportPreviewModal;
