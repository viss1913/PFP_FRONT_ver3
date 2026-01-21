import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import { Download, Wallet, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Colors for charts
const COLORS = ['#C2185B', '#E91E63', '#F06292', '#F8BBD0', '#880E4F', '#AD1457'];
const COLORS_CASHFLOW = ['#0D9488', '#14B8A6', '#5EEAD4', '#CCFBF1', '#0F766E'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const ReportPreviewPage: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('pfp_report_data');
            if (stored) {
                setData(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load report data', e);
        }
    }, []);

    if (!data) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748B' }}>
                Загрузка данных отчета...
            </div>
        );
    }

    // --- Data Extraction ---
    let calcRoot = data || {};
    if (calcRoot.calculation) {
        calcRoot = calcRoot.calculation;
        if (calcRoot.calculation) {
            // Unwrapping double nesting
            calcRoot = calcRoot.calculation;
        }
    }

    const calculatedGoals = calcRoot.goals || [];

    // Tax Summary
    const taxBenefitsSummary = calcRoot?.summary?.tax_benefits_summary || {};
    const taxTotals = taxBenefitsSummary?.totals || {};

    // Portfolio
    const consolidatedPortfolio = calcRoot?.summary?.consolidated_portfolio;
    const assetsAllocation = consolidatedPortfolio?.assets_allocation || [];
    const cashFlowAllocation = consolidatedPortfolio?.cash_flow_allocation || [];

    // Transform logic for Charts
    const portfolioData = assetsAllocation.map((item: any) => ({
        name: item.name,
        value: item.amount || item.share, // fallback if amount missing
        share: item.share
    })).filter((i: any) => i.value > 0);

    const cashFlowData = cashFlowAllocation.map((item: any) => ({
        name: item.name,
        value: item.amount,
        share: item.share
    })).filter((i: any) => i.value > 0);


    return (
        <div style={{
            backgroundColor: '#F1F5F9', // Light gray background
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Floating Actions */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                display: 'flex',
                gap: 12,
                zIndex: 100
            }}>
                <button
                    onClick={() => window.close()}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: '#FFF',
                        color: '#64748B',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    Закрыть
                </button>
                <PDFDownloadLink
                    document={<ReportPDF data={data} />}
                    fileName={`financial_plan.pdf`}
                    style={{ textDecoration: 'none' }}
                >
                    {({ loading }) => (
                        <button
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '12px 24px',
                                backgroundColor: '#C2185B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(194, 24, 91, 0.3)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Download size={20} />
                            {loading ? 'Генерация PDF...' : 'Скачать PDF отчет'}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* A4 Preview Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '210mm', width: '100%' }}>

                {/* --- 1. COVER PAGE --- */}
                <div className="a4-page" style={styles.a4Page}>
                    <div style={{ position: 'relative', height: '100%', width: '100%', backgroundColor: '#0F172A', color: 'white' }}>

                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundImage: 'url(/assets/cover.png)', // Ensure this asset exists or use a gradient fallback
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.4
                        }} />
                        {/* Fallback gradient if image fails/missing */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(51,65,85,0.8) 100%)',
                            zIndex: 1
                        }} />

                        <div style={{
                            position: 'absolute',
                            bottom: '15%',
                            left: '10%',
                            right: '10%',
                            zIndex: 2
                        }}>
                            <div style={{
                                display: 'inline-block', padding: '8px 16px', backgroundColor: 'rgba(194, 24, 91, 0.9)',
                                borderRadius: '4px', marginBottom: '24px', fontSize: '14px', fontWeight: 700, letterSpacing: '2px'
                            }}>
                                ЛИЧНЫЙ ФИНАНСОВЫЙ ПЛАН
                            </div>
                            <h1 style={{ margin: '0 0 16px 0', fontSize: '48px', lineHeight: '1.1', fontWeight: 800 }}>Стратегия вашего<br />будущего</h1>
                            <p style={{ margin: '0 0 40px 0', fontSize: '20px', color: '#CBD5E1', maxWidth: '600px' }}>
                                Комплексный анализ и пошаговый план достижения финансовых целей.
                            </p>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '24px', display: 'flex', gap: '40px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase' }}>Дата формирования</div>
                                    <div style={{ fontSize: '16px', fontWeight: 500 }}>{new Date().toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase' }}>Всего целей</div>
                                    <div style={{ fontSize: '16px', fontWeight: 500 }}>{calculatedGoals.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. EXECUTIVE SUMMARY --- */}
                <div className="a4-page" style={{ ...styles.a4Page, padding: '50px' }}>
                    <div style={styles.header}>
                        <span style={styles.logo}>AI FINANCIAL PLANNER</span>
                        <span style={{ color: '#94A3B8' }}>Резюме плана</span>
                    </div>

                    <h2 style={styles.heading1}>Обзор стратегии</h2>
                    <p style={styles.text}>
                        Ваш финансовый план сбалансирован с учетом текущих водных данных.
                        В основе стратегии лежит диверсификация активов и оптимизация налоговых льгот.
                    </p>

                    {/* KPI Cards */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ ...styles.kpiCard, flex: 1, borderLeft: '4px solid #C2185B' }}>
                            <div style={styles.kpiLabel}>Налоговые вычеты (2026)</div>
                            <div style={styles.kpiValueLarge}>{formatCurrency(taxTotals.deduction_2026 || 0)}</div>
                        </div>
                        <div style={{ ...styles.kpiCard, flex: 1, borderLeft: '4px solid #0D9488' }}>
                            <div style={styles.kpiLabel}>Общая выгода от государства</div>
                            <div style={{ ...styles.kpiValueLarge, color: '#0D9488' }}>{formatCurrency(taxTotals.total_state_benefits || taxTotals.total_deductions || 0)}</div>
                        </div>
                        <div style={{ ...styles.kpiCard, flex: 1, borderLeft: '4px solid #6366f1' }}>
                            <div style={styles.kpiLabel}>Итоговый капитал</div>
                            <div style={{ ...styles.kpiValueLarge, color: '#6366f1' }}>{formatCurrency(calcRoot?.summary?.total_target_amount_future || 0)}</div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div style={{ display: 'flex', gap: '40px', height: '300px' }}>
                        {/* Portfolio Alloc */}
                        <div style={{ flex: 1 }}>
                            <h3 style={styles.heading2}>Структура активов</h3>
                            <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={portfolioData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {portfolioData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Label */}
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)',
                                    textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#334155' }}>{assetsAllocation.length}</div>
                                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Инструментов</div>
                                </div>
                            </div>
                        </div>

                        {/* Cash Flow Alloc */}
                        <div style={{ flex: 1 }}>
                            <h3 style={styles.heading2}>Распределение потоков</h3>
                            <div style={{ width: '100%', height: '240px' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={cashFlowData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {cashFlowData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_CASHFLOW[index % COLORS_CASHFLOW.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. GOALS DETAIL PAGES --- */}
                {/*  We can fit ~2 goals per page or 1 detailed goal per page. Let's do 1 per page for richness. */}
                {calculatedGoals.map((goal: any, index: number) => {
                    const summary = goal.summary || {};
                    const details = goal.details || {};
                    const cost = details.target_capital_required || details.target_amount || summary.target_amount || 0;
                    const monthly = summary.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0);

                    return (
                        <div key={index} className="a4-page" style={{ ...styles.a4Page, padding: '50px' }}>
                            <div style={styles.header}>
                                <span style={styles.logo}>ЦЕЛЬ №{index + 1}</span>
                                <span style={{ color: '#94A3B8' }}>{goal.goal_type}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={{ ...styles.heading1, marginBottom: '8px' }}>{goal.goal_name || `Цель ${index + 1}`}</h2>
                                    <div style={styles.tag}>{goal.goal_type || 'Тип не указан'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>Примерная стоимость</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#C2185B' }}>{formatCurrency(cost)}</div>
                                </div>
                            </div>

                            {/* Main Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                                <div style={styles.card}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <Wallet size={18} color="#C2185B" />
                                        <span style={styles.cardTitle}>Финансирование</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Начальный капитал</span>
                                        <span style={styles.value}>{formatCurrency(summary.initial_capital || 0)}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Ежемесячный взнос</span>
                                        <span style={styles.value}>{formatCurrency(monthly)}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Налоговый возврат</span>
                                        <span style={{ ...styles.value, color: '#10B981' }}>+{formatCurrency(summary.total_tax_benefit || 0)}</span>
                                    </div>
                                </div>

                                <div style={styles.card}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <TrendingUp size={18} color="#C2185B" />
                                        <span style={styles.cardTitle}>Параметры</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Срок</span>
                                        <span style={styles.value}>{details.term_months || summary.term_months || 0} месяцев</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Инфляция</span>
                                        <span style={styles.value}>{details.inflation_rate || summary.inflation_rate || 5.6}%</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Тип риска</span>
                                        <span style={styles.value}>{details.risk_profile || 'Balanced'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instruments / Allocation for this goal */}
                            <h3 style={styles.heading2}>Инструменты реализации</h3>
                            <div style={{
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Инструмент</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Доля</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Доходность</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(summary.assets_allocation || []).map((dbItem: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: i === (summary.assets_allocation.length - 1) ? 'none' : '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '12px 16px', color: '#1E293B' }}>{dbItem.name}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#1E293B' }}>{dbItem.share}%</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10B981' }}>{dbItem.yield || dbItem.yield_percent}%</td>
                                            </tr>
                                        ))}
                                        {(!summary.assets_allocation || summary.assets_allocation.length === 0) && (
                                            <tr>
                                                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                                                    Используется общий портфель стратегии
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}

            </div>

            <style>{`
                .a4-page {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
                    margin: 0 auto;
                    overflow: hidden;
                    box-sizing: border-box;
                    flex-shrink: 0; /* Prevent flex shrinking */
                }
                @media print {
                    body { background: none; }
                    .a4-page { box-shadow: none; margin: 0; page-break-after: always; }
                    button { display: none !important; }
                }
            `}</style>
        </div>
    );
};

const styles: any = {
    a4Page: {
        position: 'relative'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '20px',
        marginBottom: '40px'
    },
    logo: {
        color: '#C2185B',
        fontWeight: 800,
        fontSize: '12px',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    heading1: {
        fontSize: '28px',
        color: '#1E293B',
        marginBottom: '20px',
        fontWeight: 700
    },
    heading2: {
        fontSize: '18px',
        color: '#334155',
        marginBottom: '16px',
        fontWeight: 600
    },
    text: {
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#475569',
        marginBottom: '30px'
    },
    card: {
        background: '#FFF',
        padding: '24px',
        borderRadius: '12px', // Softer radius
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    kpiCard: {
        background: '#FFF',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    kpiLabel: {
        fontSize: '12px',
        color: '#64748B',
        marginBottom: '8px',
        fontWeight: 500
    },
    kpiValueLarge: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#C2185B'
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px dashed #F1F5F9'
    },
    label: {
        fontSize: '13px',
        color: '#64748B'
    },
    value: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#0F172A'
    },
    tag: {
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: '#FCE4EC',
        color: '#C2185B',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#334155'
    }
};

export default ReportPreviewPage;
