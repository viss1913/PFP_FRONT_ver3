import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import { Download } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { clientApi } from '../api/clientApi';

// Colors
const COLORS_PIE = ['#C2185B', '#1976D2', '#388E3C', '#FBC02D', '#8E24AA', '#F57C00'];
const COLOR_WATERFALL_BASE = '#94A3B8';
const COLOR_WATERFALL_STATE = '#10B981';
const COLOR_WATERFALL_INVEST = '#F59E0B';
const COLOR_WATERFALL_TOTAL = '#C2185B';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const ReportPreviewPage: React.FC = () => {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Report Data
    useEffect(() => {
        const loadReport = async () => {
            try {
                // Try to get clientId from URL or localStorage
                const urlParams = new URLSearchParams(window.location.search);
                const clientIdParam = urlParams.get('clientId');

                // Fallback: try to find active client in localStorage or recent calculation
                let clientId = clientIdParam ? parseInt(clientIdParam) : null;

                if (!clientId) {
                    const storedClient = localStorage.getItem('current_client');
                    if (storedClient) {
                        const c = JSON.parse(storedClient);
                        clientId = c.id;
                    }
                }

                if (!clientId) {
                    throw new Error("Client ID not found. Please open report from the client list.");
                }

                const data = await clientApi.getReport(clientId);
                setReportData(data);
            } catch (err: any) {
                console.error('Report fetch error:', err);
                setError(err.message || "Failed to load report data");
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, []);

    if (loading) return <div style={styles.center}>Загрузка отчета...</div>;
    if (error) return <div style={styles.center}>Ошибка: {error}</div>;
    if (!reportData) return <div style={styles.center}>Нет данных для отображения</div>;

    // --- Data Preparation ---
    const { client_info, ai_executive_summary, current_situation, overall_plan, goals_detailed } = reportData;

    // Chart A: Waterfall (Simple Bar representation for now as recharts doesn't have true waterfall easily, stacked bar is good)
    const waterfallDataRaw = overall_plan?.chart_waterfall || {};
    const waterfallChartData = [
        { name: 'Вложения клиента', amount: waterfallDataRaw.invested_by_client, fill: COLOR_WATERFALL_BASE },
        { name: 'Помощь государства', amount: waterfallDataRaw.state_support_nominal, fill: COLOR_WATERFALL_STATE },
        { name: 'Инвест. доход', amount: waterfallDataRaw.investment_income, fill: COLOR_WATERFALL_INVEST },
        { name: 'ИТОГО КАПИТАЛ', amount: waterfallDataRaw.total_projected, fill: COLOR_WATERFALL_TOTAL, isTotal: true },
    ];

    // Chart B: Portfolio Pie
    const portfolioAlloc = overall_plan?.consolidated_portfolio?.assets_allocation || [];
    const pieData = portfolioAlloc.map((item: any) => ({
        name: item.name,
        value: item.share
    }));

    return (
        <div style={styles.container}>
            {/* Header / Actions */}
            <div style={styles.toolbar}>
                <button onClick={() => window.close()} style={styles.btnSecondary}>Закрыть</button>
                <PDFDownloadLink
                    document={<ReportPDF data={reportData} />}
                    fileName={`financial_plan_${client_info?.uuid || 'client'}.pdf`}
                    style={{ textDecoration: 'none' }}
                >
                    {({ loading: pdfLoading }) => (
                        <button disabled={pdfLoading} style={styles.btnPrimary}>
                            <Download size={18} />
                            {pdfLoading ? 'Генерация...' : 'Скачать PDF'}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            <div style={styles.a4Wrapper}>

                {/* --- BLOCK 1: HEADER & AI SUMMARY --- */}
                <div style={styles.block}>
                    <div style={styles.headerRow}>
                        <div>
                            <h1 style={styles.mainTitle}>{client_info.fio || 'Клиент'}</h1>
                            <div style={styles.subTitle}>Личный Финансовый План</div>
                            <div style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>
                                Возраст: {client_info.age} лет | Email: {client_info.email}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={styles.logo}>AI FINANCIAL PLANNER</div>
                            <div style={styles.date}>{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {ai_executive_summary ? (
                        <div style={styles.aiBox}>
                            <div style={styles.aiLabel}>Мнение ИИ-Советника</div>
                            <ReactMarkdown components={{
                                p: ({ node, ...props }) => <p style={styles.mdP} {...props} />
                            }}>
                                {ai_executive_summary}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div style={styles.aiBoxEmpty}>
                            AI summary is generating or unavailable.
                        </div>
                    )}
                </div>

                {/* --- BLOCK 2: FINANCIAL HEALTH --- */}
                <div style={{ ...styles.block, background: '#F8FAFC' }}>
                    <h2 style={styles.blockTitle}>Текущее финансовое состояние</h2>
                    <div style={styles.kpiGrid}>
                        <KpiCard label="Активы" value={current_situation?.assets_total} color="#0F172A" />
                        <KpiCard label="Обязательства" value={current_situation?.liabilities_total} color="#DC2626" />
                        <KpiCard label="Чистый капитал" value={current_situation?.net_worth} color="#059669" isBig />
                    </div>
                </div>

                {/* --- BLOCK 3: PLAN EFFICIENCY (CHARTS) --- */}
                <div style={styles.block}>
                    <h2 style={styles.blockTitle}>Эффективность стратегии</h2>
                    <div style={styles.chartsRow}>

                        {/* Waterfall Chart */}
                        <div style={styles.chartCol}>
                            <h3 style={styles.chartTitle}>Откуда возьмется капитал?</h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={waterfallChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                            {waterfallChartData.map((entry: { fill: string }, index: number) => (
                                                <Cell key={index} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div style={styles.chartCol}>
                            <h3 style={styles.chartTitle}>Структура портфеля</h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((_: any, index: number) => (
                                                <Cell key={index} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- BLOCK 4: GOALS DETAILED --- */}
                <div style={styles.block}>
                    <h2 style={styles.blockTitle}>Детализация по целям</h2>
                    <div style={styles.goalsGrid}>
                        {goals_detailed?.map((goal: any, idx: number) => (
                            <div key={idx} style={styles.goalCard}>
                                <div style={styles.goalHeader}>
                                    <span style={styles.goalType}>{goal.type}</span>
                                    <span style={styles.goalName}>{goal.name}</span>
                                </div>
                                <div style={styles.goalRow}>
                                    <span>Ежемесячный платеж:</span>
                                    <strong>{formatCurrency(goal.monthly_payment)}</strong>
                                </div>
                                <div style={styles.goalRow}>
                                    <span>Срок:</span>
                                    <strong>{goal.term_months} мес.</strong>
                                </div>
                                <div style={styles.goalRow}>
                                    <span>Прогноз накоплений:</span>
                                    <strong style={{ color: '#C2185B' }}>{formatCurrency(goal.projected_amount)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const KpiCard = ({ label, value, color, isBig }: any) => (
    <div style={styles.kpiCard}>
        <div style={styles.kpiLabel}>{label}</div>
        <div style={{ ...styles.kpiValue, fontSize: isBig ? 32 : 24, color }}>
            {formatCurrency(value || 0)}
        </div>
    </div>
);

const styles: any = {
    container: {
        background: '#E2E8F0',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif"
    },
    center: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748B'
    },
    toolbar: {
        position: 'fixed', top: 20, right: 20, display: 'flex', gap: 12, zIndex: 100
    },
    btnPrimary: {
        display: 'flex', gap: 8, alignItems: 'center', padding: '10px 20px', background: '#C2185B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    btnSecondary: {
        padding: '10px 20px', background: 'white', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    a4Wrapper: {
        width: '210mm',
        minHeight: '297mm',
        background: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        padding: '50px',
        boxSizing: 'border-box'
    },
    block: {
        marginBottom: 40
    },
    headerRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30
    },
    mainTitle: {
        fontSize: 32, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.1
    },
    subTitle: {
        fontSize: 18, color: '#C2185B', fontWeight: 600, marginTop: 4
    },
    logo: {
        fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: 1
    },
    date: {
        fontSize: 14, fontWeight: 500, color: '#334155', marginTop: 4
    },
    aiBox: {
        background: '#F0FDF4', borderLeft: '4px solid #16A34A', padding: '20px', borderRadius: '4px'
    },
    aiBoxEmpty: {
        background: '#F1F5F9', padding: '20px', borderRadius: '4px', textAlign: 'center', color: '#94A3B8'
    },
    aiLabel: {
        fontSize: 12, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: 8
    },
    mdP: {
        margin: '0 0 10px 0', fontSize: 14, lineHeight: 1.6, color: '#334155'
    },
    blockTitle: {
        fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 20, borderBottom: '2px solid #F1F5F9', paddingBottom: 10
    },
    kpiGrid: {
        display: 'flex', gap: 20
    },
    kpiCard: {
        flex: 1, padding: 20, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    kpiLabel: {
        fontSize: 13, color: '#64748B', marginBottom: 5
    },
    kpiValue: {
        fontWeight: 700
    },
    chartsRow: {
        display: 'flex', gap: 40
    },
    chartCol: {
        flex: 1
    },
    chartTitle: {
        fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 15, textAlign: 'center'
    },
    goalsGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20
    },
    goalCard: {
        border: '1px solid #E2E8F0', borderRadius: 8, padding: 16
    },
    goalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12
    },
    goalType: {
        fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700
    },
    goalName: {
        fontSize: 16, fontWeight: 700, color: '#1E293B'
    },
    goalRow: {
        display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6
    }
};

export default ReportPreviewPage;
