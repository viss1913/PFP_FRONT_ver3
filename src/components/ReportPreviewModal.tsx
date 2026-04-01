import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, X } from 'lucide-react';
import axios from 'axios';
import { clientApi, type ReportTocItem } from '../api/clientApi';

interface ReportPreviewModalProps {
    isOpen: boolean;
    clientId: number | null;
    onClose: () => void;
}

type ReportState = {
    pdfUrl: string | null;
    toc: ReportTocItem[];
    generatedAt: string | null;
    loading: boolean;
    error: string | null;
};

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) return 'Сессия истекла. Войди заново.';
        if (status === 403) return 'Нет доступа к отчету.';
        if (status === 404) return 'Отчет не найден.';
        if (status === 500) return 'Ошибка генерации отчета. Попробуй позже.';
    }
    return 'Не удалось выполнить запрос.';
};

const createInitialReportState = (): ReportState => ({
    pdfUrl: null,
    toc: [],
    generatedAt: null,
    loading: false,
    error: null,
});

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

    const canGoBack = activeIndex > 0;
    const canGoNext = activeIndex < reportState.toc.length - 1;
    const activeTocItem = reportState.toc[activeIndex] || null;
    const modalTitle = useMemo(() => `Отчет по клиенту #${clientId ?? ''}`.trim(), [clientId]);
    const generatedAtLabel = useMemo(() => formatGeneratedAt(reportState.generatedAt), [reportState.generatedAt]);

    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setActiveIndex(0);
        setReportState(createInitialReportState());
    }, [isOpen, clientId]);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        setReportState((prev) => ({ ...prev, loading: true, error: null }));

        clientApi
            .getMyPlanReportPdfUrl()
            .then((payload) => {
                if (cancelled) return;
                const sortedToc = [...(payload.toc || [])].sort((a, b) => a.order - b.order);
                setReportState({
                    pdfUrl: payload.pdf_url,
                    toc: sortedToc,
                    generatedAt: payload.generated_at || null,
                    loading: false,
                    error: null,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                setReportState({
                    pdfUrl: null,
                    toc: [],
                    generatedAt: null,
                    loading: false,
                    error: getErrorMessage(error),
                });
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft' && canGoBack) setActiveIndex((prev) => prev - 1);
            if (event.key === 'ArrowRight' && canGoNext) setActiveIndex((prev) => prev + 1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose, canGoBack, canGoNext]);

    const handleDownloadPdf = () => {
        if (!reportState.pdfUrl) return;
        window.open(reportState.pdfUrl, '_blank', 'noopener,noreferrer');
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 5000,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: 'min(1320px, 96vw)',
                    height: '92vh',
                    background: '#fff',
                    borderRadius: '20px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={!reportState.pdfUrl}
                            style={{
                                border: 'none',
                                background: 'var(--primary)',
                                color: '#fff',
                                borderRadius: '999px',
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: reportState.pdfUrl ? 'pointer' : 'not-allowed',
                                opacity: reportState.pdfUrl ? 1 : 0.75,
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

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 0 }}>
                    <aside style={{ borderRight: '1px solid #eee', padding: '14px', overflowY: 'auto' }}>
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
                        <div style={{ height: '100%', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
                            {reportState.loading && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                                    Генерирую и загружаю PDF-отчет...
                                </div>
                            )}

                            {!reportState.loading && reportState.error && (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', textAlign: 'center', padding: '16px' }}>
                                    {reportState.error}
                                </div>
                            )}

                            {!reportState.loading && !reportState.error && reportState.pdfUrl && activeTocItem && (
                                <iframe
                                    title={`report-page-${activeTocItem.id}`}
                                    src={`${reportState.pdfUrl}#page=${activeTocItem.page_start}`}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            )}

                            {!reportState.loading && !reportState.error && (!reportState.pdfUrl || !activeTocItem) && (
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
                        disabled={!canGoBack}
                        style={{
                            border: '1px solid #ddd',
                            background: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: canGoBack ? 'pointer' : 'not-allowed',
                            opacity: canGoBack ? 1 : 0.5,
                        }}
                    >
                        <ChevronLeft size={16} />
                        Назад
                    </button>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        {activeTocItem ? `Раздел ${activeIndex + 1} из ${reportState.toc.length} · стр. ${activeTocItem.page_start}` : 'Разделы не загружены'}
                    </div>
                    <button
                        onClick={() => setActiveIndex((prev) => Math.min(prev + 1, reportState.toc.length - 1))}
                        disabled={!canGoNext}
                        style={{
                            border: 'none',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: canGoNext ? 'pointer' : 'not-allowed',
                            opacity: canGoNext ? 1 : 0.5,
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
