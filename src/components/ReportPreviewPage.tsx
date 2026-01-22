import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import { Download, Shield, CheckCircle2 } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { clientApi } from '../api/clientApi';

// Colors from Figma
const COLORS_FIGMA = {
    primary: '#6B214C', // Deep Purple
    dark: '#1E1E1E',
    light: '#F8FAFC',
    slate: '#64748B',
    green: '#10B981',
    border: '#E2E8F0',
};

const COLORS_PIE = ['#6B214C', '#A855F7', '#D8B4FE', '#F3E8FF', '#4C1D95', '#7C3AED'];
const COLOR_WATERFALL_BASE = '#1E1E1E';
const COLOR_WATERFALL_STATE = '#A855F7';
const COLOR_WATERFALL_INVEST = '#D8B4FE';
const COLOR_WATERFALL_TOTAL = '#6B214C';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// --- Summary Templates ---
const getSummaryTemplate = (data: any) => {
    const goals = data.goals_detailed || [];
    const hasGap = goals.some((g: any) => g.summary?.status === 'GAP');
    const clientName = data.client_info?.full_name?.split(' ')[0] || 'Клиент';

    if (hasGap) {
        return `Здравствуйте, ${clientName}! Я проанализировала ваши цели и текущие возможности. В плане обнаружен дефицит капитала для достижения некоторых целей. Мы рекомендуем рассмотреть увеличение ежемесячных взносов или использование налоговых льгот (ПДС), чтобы выйти на желаемый уровень дохода в будущем. Ваш план требует небольшой корректировки для 100% уверенности.`;
    }

    return `Здравствуйте, ${clientName}! Я проанализировала ваши финансовые цели. Ваш план выглядит отлично — текущая стратегия позволяет достичь всех поставленных задач в срок. Мы распределили активы таким образом, чтобы минимизировать риски и обеспечить стабильный рост капитала. Вы на верном пути к финансовой независимости!`;
};

export const ReportPreviewPage: React.FC = () => {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReport = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const clientIdParam = urlParams.get('clientId');
                let clientId = clientIdParam ? parseInt(clientIdParam) : null;

                if (!clientId) {
                    const storedClient = localStorage.getItem('current_client');
                    if (storedClient) {
                        const c = JSON.parse(storedClient);
                        clientId = c.id;
                    }
                }

                if (!clientId) {
                    throw new Error("Client ID not found.");
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

    const { client_info, current_situation, overall_plan, goals_detailed, insurance_protection } = reportData;

    // Chart Data
    const waterfallDataRaw = overall_plan?.chart_waterfall || {};
    const waterfallChartData = [
        { name: 'Вложения', amount: waterfallDataRaw.invested_by_client, fill: COLOR_WATERFALL_BASE },
        { name: 'Государство', amount: waterfallDataRaw.state_support_nominal, fill: COLOR_WATERFALL_STATE },
        { name: 'Инвест. доход', amount: waterfallDataRaw.investment_income, fill: COLOR_WATERFALL_INVEST },
        { name: 'ИТОГО', amount: waterfallDataRaw.total_projected, fill: COLOR_WATERFALL_TOTAL },
    ];

    const portfolioAlloc = overall_plan?.consolidated_portfolio?.assets_allocation || [];
    const pieData = portfolioAlloc.map((item: any) => ({
        name: item.name,
        value: item.share
    }));

    return (
        <div style={styles.container}>
            <div style={styles.toolbar}>
                <button onClick={() => window.close()} style={styles.btnSecondary}>Закрыть</button>
                <PDFDownloadLink
                    document={<ReportPDF data={reportData} />}
                    fileName={`financial_plan_${client_info?.id || 'client'}.pdf`}
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
                {/* --- COVER SECTION --- */}
                <div style={styles.coverSection}>
                    <img
                        src="/assets/report_cover.png"
                        style={styles.coverImg}
                        alt="Cover"
                        onError={(e) => {
                            // Fallback if local path fails in certain environments
                            e.currentTarget.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000";
                        }}
                    />
                    <div style={styles.coverTitleBox}>
                        <div style={styles.coverLabel}>ПЕРСОНАЛЬНОЕ ФИНАНСОВОЕ РЕШЕНИЕ</div>
                        <div style={styles.coverClientName}>{client_info?.full_name || 'Клиент'}</div>
                        <div style={styles.coverDate}>{new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>

                {/* --- AI SUMMARY SECTION --- */}
                <div style={styles.block}>
                    <div style={styles.aiContainer}>
                        <div style={styles.aiAvatarBox}>
                            <img
                                src="/assets/ai_avatar.png"
                                style={styles.aiAvatar}
                                alt="AI Avatar"
                            />
                        </div>
                        <div style={styles.aiTextBox}>
                            <div style={styles.aiLabel}>МНЕНИЕ ИИ-СОВЕТНИКА</div>
                            <div style={styles.aiMessage}>
                                {getSummaryTemplate(reportData)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FINANCIAL HEALTH --- */}
                <div style={styles.block}>
                    <h2 style={styles.blockTitle}>Текущее финансовое состояние</h2>
                    <div style={styles.kpiGrid}>
                        <KpiCard label="Активы" value={current_situation?.assets_total} color={COLORS_FIGMA.dark} />
                        <KpiCard label="Обязательства" value={current_situation?.liabilities_total} color="#DC2626" />
                        <KpiCard label="Чистый капитал" value={current_situation?.net_worth} color={COLORS_FIGMA.primary} isBig />
                    </div>
                </div>

                {/* --- CHARTS --- */}
                <div style={styles.block}>
                    <h2 style={styles.blockTitle}>Эффективность стратегии</h2>
                    <div style={styles.chartsRow}>
                        <div style={styles.chartCol}>
                            <h3 style={styles.chartTitle}>Откуда возьмется капитал?</h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={waterfallChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: COLORS_FIGMA.slate }} />
                                        <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                            {waterfallChartData.map((entry, index) => (
                                                <Cell key={index} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div style={styles.chartCol}>
                            <h3 style={styles.chartTitle}>Структура портфеля</h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={4} dataKey="value"
                                        >
                                            {pieData.map((_, index: number) => (
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

                {/* --- INSURANCE SECTION --- */}
                {insurance_protection && insurance_protection.length > 0 && (
                    <div style={styles.block}>
                        <h2 style={styles.blockTitle}>Страховая защита</h2>
                        {insurance_protection.map((prog: any, i: number) => (
                            <div key={i} style={styles.insuranceCard}>
                                <div style={styles.insuranceHeader}>
                                    <Shield size={24} color={COLORS_FIGMA.primary} />
                                    <span style={styles.insuranceName}>{prog.program_name}</span>
                                </div>
                                <div style={styles.riskGrid}>
                                    {prog.risks?.map((risk: any, j: number) => (
                                        <div key={j} style={styles.riskItem}>
                                            <div style={styles.riskLabel}>{risk.risk_name}</div>
                                            <div style={styles.riskValue}>{formatCurrency(risk.limit_amount)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- GOALS DETAILED --- */}
                <div style={styles.block}>
                    <h2 style={styles.blockTitle}>Детализация по целям</h2>
                    <div style={styles.goalsGrid}>
                        {goals_detailed?.map((goal: any, idx: number) => {
                            const type = goal.goal_type || goal.type;
                            if (type === 'PENSION') return <PensionGoalCard key={idx} goal={goal} />;

                            const summary = goal.summary || {};
                            const projected = summary.projected_capital_at_end || 0;
                            return (
                                <div key={idx} style={styles.goalCard}>
                                    <div style={styles.goalHeader}>
                                        <span style={styles.goalType}>{type}</span>
                                        <span style={styles.goalName}>{goal.goal_name || goal.name}</span>
                                    </div>
                                    <div style={styles.goalContent}>
                                        <div style={styles.goalCheckItem}>
                                            <CheckCircle2 size={14} color={COLORS_FIGMA.primary} />
                                            <span>Пополнение: <strong>{formatCurrency(summary.monthly_replenishment || 0)}</strong></span>
                                        </div>
                                        <div style={styles.goalCheckItem}>
                                            <CheckCircle2 size={14} color={COLORS_FIGMA.primary} />
                                            <span>Срок: <strong>{summary.target_months || 0} мес.</strong></span>
                                        </div>
                                        <div style={styles.goalCheckItem}>
                                            <CheckCircle2 size={14} color={COLORS_FIGMA.primary} />
                                            <span>Цель: <strong style={{ color: COLORS_FIGMA.primary }}>{formatCurrency(projected)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PensionGoalCard = ({ goal }: any) => {
    const summary = goal.summary || {};
    const details = goal.details?.state_pension || {};
    const pensionToday = summary.state_pension_monthly_today || 0;
    const pensionFuture = summary.state_pension_monthly_future || 0;

    return (
        <div style={{ ...styles.goalCard, gridColumn: 'span 2', background: '#F8F9FA' }}>
            <div style={styles.goalHeader}>
                <span style={styles.goalType}>ГОСУДАРСТВЕННАЯ ПЕНСИЯ</span>
                <span style={styles.goalName}>{goal.goal_name || 'Страховая пенсия РФ'}</span>
            </div>
            <div style={styles.pensionGrid}>
                <div style={styles.pensionCol}>
                    <div style={styles.sectionLabel}>Расчет в ценах сегодня</div>
                    <div style={styles.pensionBigValue}>{formatCurrency(pensionToday)}</div>
                    <div style={styles.pensionSubText}>Фикс. выплата + баллы {details.ipk_current?.toFixed(1)}</div>
                </div>
                <div style={styles.pensionCol}>
                    <div style={styles.sectionLabel}>Перспектива (инфляция {summary.inflation_rate}%)</div>
                    <div style={{ ...styles.pensionBigValue, color: COLORS_FIGMA.primary }}>{formatCurrency(pensionFuture)}</div>
                    <div style={styles.pensionSubText}>Через {details.years_to_pension} лет</div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ label, value, color, isBig }: any) => (
    <div style={styles.kpiCard}>
        <div style={styles.kpiLabel}>{label}</div>
        <div style={{ ...styles.kpiValue, fontSize: isBig ? 28 : 20, color }}>
            {formatCurrency(value || 0)}
        </div>
    </div>
);

const styles: any = {
    container: {
        background: '#F1F5F9', minHeight: '100vh', padding: '40px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Inter', sans-serif"
    },
    center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
    toolbar: { position: 'fixed', top: 20, right: 20, display: 'flex', gap: 12, zIndex: 100 },
    btnPrimary: {
        display: 'flex', gap: 8, alignItems: 'center', padding: '10px 20px', background: COLORS_FIGMA.primary,
        color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    btnSecondary: {
        padding: '10px 20px', background: 'white', color: COLORS_FIGMA.dark, border: '1px solid #CBD5E1',
        borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    a4Wrapper: {
        width: '210mm', minHeight: '297mm', background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        padding: '0', boxSizing: 'border-box', overflow: 'hidden'
    },
    coverSection: {
        height: '140mm', position: 'relative', background: '#000', marginBottom: 40
    },
    coverImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 },
    coverTitleBox: {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: COLORS_FIGMA.primary, padding: '40px 60px', borderRadius: 0, textAlign: 'center', color: 'white',
        width: '80%'
    },
    coverLabel: { fontSize: 12, letterSpacing: 2, fontWeight: 300, marginBottom: 15 },
    coverClientName: { fontSize: 32, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' },
    coverDate: { fontSize: 14, opacity: 0.8 },
    block: { padding: '0 50px', marginBottom: 50 },
    blockTitle: {
        fontSize: 22, fontWeight: 800, color: COLORS_FIGMA.dark, marginBottom: 25,
        borderLeft: `5px solid ${COLORS_FIGMA.primary}`, paddingLeft: 15
    },
    aiContainer: {
        background: '#FDF2F8', borderRadius: 16, padding: 30, display: 'flex', gap: 25, alignItems: 'center',
        border: '1px solid #FCE7F3'
    },
    aiAvatarBox: {
        width: 100, height: 100, borderRadius: 50, overflow: 'hidden', border: '3px solid white', flexShrink: 0
    },
    aiAvatar: { width: '100%', height: '100%', objectFit: 'cover' },
    aiTextBox: { flex: 1 },
    aiLabel: { fontSize: 11, fontWeight: 800, color: '#BE185D', letterSpacing: 1, marginBottom: 10 },
    aiMessage: { fontSize: 15, lineHeight: 1.6, color: COLORS_FIGMA.dark, fontStyle: 'italic' },
    kpiGrid: { display: 'flex', gap: 20 },
    kpiCard: {
        flex: 1, padding: 25, background: COLORS_FIGMA.light, borderRadius: 12, border: `1px solid ${COLORS_FIGMA.border}`
    },
    kpiLabel: { fontSize: 12, color: COLORS_FIGMA.slate, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 },
    kpiValue: { fontWeight: 800 },
    chartsRow: { display: 'flex', gap: 30 },
    chartCol: { flex: 1 },
    chartTitle: { fontSize: 14, fontWeight: 700, color: COLORS_FIGMA.slate, marginBottom: 20, textAlign: 'center' },
    insuranceCard: {
        background: 'white', border: `1px solid ${COLORS_FIGMA.border}`, borderRadius: 12, padding: 25, marginBottom: 20
    },
    insuranceHeader: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 },
    insuranceName: { fontSize: 18, fontWeight: 800, color: COLORS_FIGMA.dark },
    riskGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 },
    riskItem: { padding: 15, background: COLORS_FIGMA.light, borderRadius: 8 },
    riskLabel: { fontSize: 11, color: COLORS_FIGMA.slate, marginBottom: 5 },
    riskValue: { fontSize: 14, fontWeight: 700, color: COLORS_FIGMA.primary },
    goalsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    goalCard: { border: `1px solid ${COLORS_FIGMA.border}`, borderRadius: 12, padding: 20 },
    goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    goalType: { fontSize: 10, color: COLORS_FIGMA.primary, fontWeight: 800, background: '#FDF2F8', padding: '2px 8px', borderRadius: 4 },
    goalName: { fontSize: 18, fontWeight: 800, color: COLORS_FIGMA.dark },
    goalContent: { display: 'flex', flexDirection: 'column', gap: 10 },
    goalCheckItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: COLORS_FIGMA.dark },
    pensionGrid: { display: 'flex', gap: 30, marginTop: 10 },
    pensionCol: { flex: 1 },
    sectionLabel: { fontSize: 11, color: COLORS_FIGMA.slate, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 },
    pensionBigValue: { fontSize: 24, fontWeight: 800 },
    pensionSubText: { fontSize: 12, color: COLORS_FIGMA.slate, marginTop: 5 },
};

export default ReportPreviewPage;
