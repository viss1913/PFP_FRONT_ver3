import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import { Download } from 'lucide-react';

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Загрузка данных отчета...
            </div>
        );
    }

    const calcRoot = data?.calculation || data || {};
    const calculatedGoals = calcRoot.goals || [];
    // Tax Summary
    const taxBenefitsSummary = (data?.summary?.tax_benefits_summary || calcRoot?.summary?.tax_benefits_summary) || {};
    const taxTotals = taxBenefitsSummary?.totals || {};

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div style={{
            backgroundColor: '#525659',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 20px',
            fontFamily: "'Roboto', sans-serif"
        }}>
            {/* Floating Actions */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                display: 'flex',
                gap: 10,
                zIndex: 100
            }}>
                <PDFDownloadLink
                    document={<ReportPDF data={data} />}
                    fileName={`financial_plan_${new Date().toISOString().split('T')[0]}.pdf`}
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
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                            }}
                        >
                            <Download size={20} />
                            {loading ? 'Генерация...' : 'Сохранить PDF'}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* A4 Preview Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                {/* Cover Page */}
                <div className="a4-page" style={styles.a4Page}>
                    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                        <img
                            src="/assets/cover.png"
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '100px',
                            left: '40px',
                            right: '40px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '30px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#0F172A' }}>Личный Финансовый План</h1>
                            <p style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#475569' }}>Стратегия достижения ваших целей</p>
                            <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '15px' }}>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#64748B' }}>Дата: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Page */}
                <div className="a4-page" style={{ ...styles.a4Page, padding: '40px' }}>
                    <div style={styles.header}>
                        <span style={styles.logo}>AI FINANCIAL PLANNER</span>
                        <span style={{ color: '#94A3B8' }}>{new Date().toLocaleDateString()}</span>
                    </div>

                    <h2 style={styles.heading1}>Резюме плана</h2>
                    <p style={styles.text}>
                        В данном отчете представлен детальный анализ вашей финансовой ситуации и предложена стратегия для достижения поставленных целей.
                        Мы учли ваши текущие активы, доходы и склонность к риску.
                    </p>

                    <div style={styles.card}>
                        <h3 style={styles.heading2}>Ключевые показатели</h3>
                        <div style={styles.row}>
                            <span style={styles.label}>Количество целей</span>
                            <span style={styles.value}>{calculatedGoals.length}</span>
                        </div>
                        <div style={styles.row}>
                            <span style={styles.label}>Налоговые вычеты (2026)</span>
                            <span style={styles.valueLarge}>{formatCurrency(taxTotals.deduction_2026 || 0)}</span>
                        </div>
                        <div style={styles.row}>
                            <span style={styles.label}>Общий эффект</span>
                            <span style={styles.valueLarge}>{formatCurrency(taxTotals.total_deductions || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Goals Page */}
                <div className="a4-page" style={{ ...styles.a4Page, padding: '40px' }}>
                    <div style={styles.header}>
                        <span style={styles.logo}>ФИНАНСОВЫЕ ЦЕЛИ</span>
                    </div>

                    <h2 style={styles.heading1}>Детализация целей</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {calculatedGoals.map((goal: any, index: number) => {
                            const summary = goal.summary || {};
                            const details = goal.details || {};
                            const cost = details.target_capital_required || details.target_amount || summary.target_amount || 0;
                            const monthly = summary.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0);

                            return (
                                <div key={index} style={styles.goalCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                                        <span style={{ fontSize: '18px', fontWeight: 700 }}>{goal.goal_name || `Цель ${index + 1}`}</span>
                                        <span style={{ fontSize: '14px', color: '#94A3B8' }}>{goal.goal_type}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <div style={styles.label}>Стоимость цели</div>
                                            <div style={styles.valueLarge}>{formatCurrency(cost)}</div>
                                        </div>
                                        <div>
                                            <div style={styles.label}>Ежемес. взнос</div>
                                            <div style={styles.valueLarge}>{formatCurrency(monthly)}</div>
                                        </div>
                                        <div>
                                            <div style={styles.label}>Начальный капитал</div>
                                            <div style={styles.value}>{formatCurrency(summary.initial_capital || 0)}</div>
                                        </div>
                                        <div>
                                            <div style={styles.label}>Срок</div>
                                            <div style={styles.value}>{details.term_months || summary.term_months || 0} мес</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            <style>{`
                .a4-page {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    margin: 0 auto;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                @media print {
                    body { background: none; }
                    .a4-page { box-shadow: none; margin: 0; page-break-after: always; }
                    button { display: none; }
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
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '1px'
    },
    heading1: {
        fontSize: '24px',
        color: '#1E293B',
        marginBottom: '20px',
        borderBottom: '2px solid #C2185B',
        paddingBottom: '10px',
        display: 'inline-block'
    },
    heading2: {
        fontSize: '18px',
        color: '#334155',
        marginBottom: '15px'
    },
    text: {
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#475569',
        marginBottom: '20px'
    },
    card: {
        background: '#F8FAFC',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0'
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px dashed #E2E8F0'
    },
    label: {
        fontSize: '12px',
        color: '#64748B'
    },
    value: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#0F172A'
    },
    valueLarge: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#C2185B'
    },
    goalCard: {
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }
};

export default ReportPreviewPage;
