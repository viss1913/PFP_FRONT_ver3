import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getGoalImage } from '../utils/GoalImages';

// Register fonts for Cyrillic support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Roboto',
        padding: 0,
    },
    // Cover Page
    coverPage: {
        height: '100%',
        position: 'relative',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
    },
    coverImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
        objectFit: 'cover',
        opacity: 0.6
    },
    coverContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: '50%',
        padding: 40,
        justifyContent: 'center',
    },
    coverTitle: {
        fontSize: 36,
        fontWeight: 700,
        marginBottom: 10,
        color: '#FFFFFF'
    },
    coverSubtitle: {
        fontSize: 20,
        marginBottom: 30,
        color: '#CBD5E1'
    },
    coverMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 5
    },

    // Standard Page
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '20 40',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        alignItems: 'center',
        marginTop: 10
    },
    headerLogo: {
        fontSize: 10,
        fontWeight: 700,
        color: '#C2185B',
        textTransform: 'uppercase'
    },
    pageNumber: {
        fontSize: 10,
        color: '#94A3B8'
    },
    content: {
        padding: 40,
        flex: 1
    },

    // Typography
    heading1: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 20,
        color: '#0F172A',
    },
    heading2: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 15,
        marginTop: 10,
        color: '#334155',
    },
    text: {
        fontSize: 11,
        lineHeight: 1.5,
        color: '#475569',
        marginBottom: 8,
    },

    // Cards & Visuals
    card: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    gridTwo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15
    },
    statItem: {
        width: '48%',
        marginBottom: 10
    },
    label: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 2
    },
    value: {
        fontSize: 12,
        fontWeight: 500,
        color: '#0F172A',
    },
    valueLarge: {
        fontSize: 16,
        fontWeight: 700,
        color: '#C2185B',
    },

    // Goal Page Specifics
    goalHero: {
        height: 180,
        width: '100%',
        marginBottom: 20,
        borderRadius: 8,
        objectFit: 'cover'
    },
    goalTitleOverlay: {
        fontSize: 28,
        fontWeight: 700,
        color: '#0F172A',
        marginBottom: 5
    },
    goalTypeLabel: {
        fontSize: 12,
        color: '#64748B',
        backgroundColor: '#F1F5F9',
        padding: '4 8',
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 20
    },

    // Portfolio
    portfolioTable: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        padding: 8,
        alignItems: 'center'
    },
    tableHeader: {
        backgroundColor: '#F8FAFC',
        fontWeight: 700,
        fontSize: 10,
        color: '#475569'
    },
    colName: { width: '60%', fontSize: 10 },
    colValue: { width: '40%', fontSize: 10, textAlign: 'right' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
});

interface ReportPDFProps {
    data: any;
    clientName?: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const ReportPDF: React.FC<ReportPDFProps> = ({ data, clientName = "Уважаемый клиент" }) => {
    let calcRoot = data || {};
    if (calcRoot.calculation) {
        calcRoot = calcRoot.calculation;
        if (calcRoot.calculation) {
            calcRoot = calcRoot.calculation;
        }
    }

    const calculatedGoals = calcRoot.goals || [];
    const consolidatedPortfolio = calcRoot?.summary?.consolidated_portfolio;
    const assetsAllocation = consolidatedPortfolio?.assets_allocation || [];

    // Tax Summary
    const taxBenefitsSummary = calcRoot?.summary?.tax_benefits_summary || {};
    const taxTotals = taxBenefitsSummary?.totals || {};

    // Current Date
    const today = new Date().toLocaleDateString('ru-RU');

    return (
        <Document>
            {/* 1. Cover Page */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverPage}>
                    {/* Abstract background image or solid color */}
                    <Image
                        src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2000"
                        style={styles.coverImage}
                    />
                    <View style={{ ...styles.coverContent, backgroundColor: 'rgba(15, 23, 42, 0.9)', height: '100%', top: 0, left: 0, width: '100%' }}>
                        <View style={{ marginTop: 300 }}>
                            <Text style={styles.coverTitle}>Личный Финансовый План</Text>
                            <Text style={styles.coverSubtitle}>Стратегия достижения ваших целей</Text>

                            <View style={{ height: 2, width: 100, backgroundColor: '#C2185B', marginBottom: 20 }}></View>

                            <Text style={styles.coverMeta}>Клиент: {clientName}</Text>
                            <Text style={styles.coverMeta}>Дата составления: {today}</Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* 2. Executive Summary */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>AI Financial Planner</Text>
                    <Text style={styles.pageNumber}>Резюме</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.heading1}>Обзор ситуации</Text>
                    <Text style={styles.text}>
                        Ниже представлены ключевые показатели вашего финансового плана.
                        Мы проанализировали {calculatedGoals.length} целей и составили оптимальную стратегию их достижения.
                    </Text>

                    <View style={{ ...styles.gridTwo, marginTop: 20 }}>
                        <View style={{ ...styles.card, width: '48%' }}>
                            <Text style={styles.label}>Количество целей</Text>
                            <Text style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{calculatedGoals.length}</Text>
                        </View>
                        <View style={{ ...styles.card, width: '48%' }}>
                            <Text style={styles.label}>Налоговая выгода (2026)</Text>
                            <Text style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>
                                +{formatCurrency(taxTotals.total_deductions || 0)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.heading2}>Портфель активов</Text>
                    <View style={styles.portfolioTable}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.colName}>Класс актива</Text>
                            <Text style={styles.colValue}>Доля портфеля</Text>
                        </View>
                        {assetsAllocation.length > 0 ? (
                            assetsAllocation.map((item: any, idx: number) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={styles.colName}>{item.name}</Text>
                                    <Text style={styles.colValue}>{item.share}%</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.tableRow}><Text style={styles.text}>Нет данных о порфтеле</Text></View>
                        )}
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Text style={styles.text}>
                            Рекомендуемая стратегия: Сбалансированный портфель с акцентом на регулярные пополнения для достижения долгосрочных целей.
                        </Text>
                    </View>
                </View>
            </Page>

            {/* 3. Goal Pages (One per Goal) */}
            {calculatedGoals.map((goal: any, index: number) => {
                const summary = goal.summary || {};
                const details = goal.details || {};
                const cost = details.target_capital_required || details.target_amount || summary.target_amount || 0;
                const monthly = summary.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0);

                // Get Image
                const img = getGoalImage(goal.goal_name || goal.name, goal.goal_type_id || 0);

                return (
                    <Page key={index} size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.headerLogo}>Цель {index + 1}</Text>
                            <Text style={styles.pageNumber}>{index + 3}</Text>
                        </View>

                        <View style={styles.content}>
                            {/* Hero Image */}
                            {img && <Image src={img} style={styles.goalHero} />}

                            <Text style={styles.goalTitleOverlay}>{goal.goal_name || `Цель ${index + 1}`}</Text>
                            <Text style={styles.goalTypeLabel}>{goal.goal_type || 'Тип не указан'}</Text>

                            <View style={styles.card}>
                                <Text style={styles.heading2}>Параметры цели</Text>
                                <View style={styles.gridTwo}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.label}>Необходимый капитал</Text>
                                        <Text style={styles.valueLarge}>{formatCurrency(cost)}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.label}>Ежемесячный взнос</Text>
                                        <Text style={styles.valueLarge}>{formatCurrency(monthly)}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.label}>Начальный капитал</Text>
                                        <Text style={styles.value}>{formatCurrency(summary.initial_capital || 0)}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.label}>Срок достижения</Text>
                                        <Text style={styles.value}>{details.term_months || summary.term_months || 0} мес.</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Goal Specific Portfolio */}
                            <Text style={styles.heading2}>Инвестиционная стратегия цели</Text>
                            <View style={styles.portfolioTable}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={styles.colName}>Инструмент</Text>
                                    <Text style={styles.colValue}>Доля</Text>
                                </View>
                                {summary.assets_allocation && summary.assets_allocation.length > 0 ? (
                                    summary.assets_allocation.map((item: any, idx: number) => (
                                        <View key={idx} style={styles.tableRow}>
                                            <Text style={styles.colName}>{item.name}</Text>
                                            <Text style={styles.colValue}>{item.share}%</Text>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.tableRow}><Text style={styles.text}>Портфель рассчитывается для всего плана</Text></View>
                                )}
                            </View>

                            {/* Risks? */}
                            {details.risks && details.risks.length > 0 && (
                                <View style={{ marginTop: 20 }}>
                                    <Text style={styles.heading2}>Покрытие рисков</Text>
                                    {details.risks.map((risk: any, rIdx: number) => (
                                        <View key={rIdx} style={styles.row}>
                                            <Text style={styles.text}>• {risk.risk_name}</Text>
                                            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{formatCurrency(risk.limit_amount)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </Page>
                );
            })}

        </Document>
    );
};

