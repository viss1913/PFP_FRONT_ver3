import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import PdfPieChart from './charts/PdfPieChart';
import { getGoalImage } from '../utils/GoalImages';

// Register fonts
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
});

const COLORS_FIGMA = {
    primary: '#6B214C', // Deep Purple
    dark: '#1E1E1E',
    light: '#F8FAFC',
    slate: '#64748B',
    white: '#FFFFFF',
    border: '#E2E8F0',
};

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Roboto',
        padding: 0,
    },
    // --- COVER PAGE STYLES ---
    coverPage: {
        height: '100%',
        width: '100%',
        position: 'relative',
        backgroundColor: '#000000',
    },
    coverImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.6,
    },
    coverTitleBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: COLORS_FIGMA.primary,
        padding: '30 50',
        textAlign: 'center',
        width: '85%',
    },
    coverLabel: {
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: 300,
        color: '#FFFFFF',
        marginBottom: 10,
    },
    coverClientName: {
        fontSize: 32,
        fontWeight: 700,
        color: '#FFFFFF',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    coverDateText: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.8,
    },

    // --- COMMON HEADER ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '20 40',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    headerLogo: {
        fontSize: 10,
        fontWeight: 700,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerPageNum: {
        fontSize: 10,
        color: '#CBD5E1',
    },

    // --- SUMMARY PAGE ---
    contentContainer: {
        padding: '30 40',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 700,
        color: COLORS_FIGMA.dark,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS_FIGMA.primary,
        paddingLeft: 10,
    },

    // AI Box in PDF
    aiContainer: {
        backgroundColor: '#FDF2F8',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    aiAvatarBox: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
    },
    aiAvatar: {
        width: '100%',
        height: '100%',
    },
    aiTextBox: {
        flex: 1,
    },
    aiLabel: {
        fontSize: 9,
        fontWeight: 700,
        color: '#BE185D',
        letterSpacing: 1,
        marginBottom: 5,
    },
    aiMessage: {
        fontSize: 11,
        lineHeight: 1.5,
        color: COLORS_FIGMA.dark,
        fontStyle: 'italic',
    },

    // Goals Table
    goalsTable: {
        marginTop: 10,
        marginBottom: 30,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    colName: { width: '50%', fontSize: 10, fontWeight: 500, color: '#334155' },
    colDate: { width: '25%', fontSize: 10, color: '#64748B', textAlign: 'center' },
    colCost: { width: '25%', fontSize: 10, color: COLORS_FIGMA.primary, textAlign: 'right', fontWeight: 700 },

    // Insurance Card in PDF
    insuranceCard: {
        backgroundColor: COLORS_FIGMA.white,
        borderWidth: 1,
        borderColor: COLORS_FIGMA.border,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    insuranceName: {
        fontSize: 14,
        fontWeight: 700,
        color: COLORS_FIGMA.dark,
        marginBottom: 12,
    },
    riskGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    riskItem: {
        flex: 1,
        backgroundColor: COLORS_FIGMA.light,
        padding: 10,
        borderRadius: 6,
    },
    riskLabel: {
        fontSize: 8,
        color: COLORS_FIGMA.slate,
        marginBottom: 3,
        textTransform: 'uppercase',
    },
    riskValue: {
        fontSize: 11,
        fontWeight: 700,
        color: COLORS_FIGMA.primary,
    },

    // Portfolio
    portfolioSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        backgroundColor: COLORS_FIGMA.light,
        padding: 20,
        borderRadius: 12,
    },
    portfolioLegend: {
        flex: 1,
        marginLeft: 40,
    },
    legendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 4,
    },
    legendLabel: { fontSize: 9, color: '#475569' },
    legendValue: { fontSize: 9, fontWeight: 700, color: COLORS_FIGMA.dark },

    // --- GOAL PAGE STYLES ---
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#F1F5F9',
    },
    goalTitle: { fontSize: 24, fontWeight: 700, color: COLORS_FIGMA.dark, marginBottom: 4 },
    goalDate: { fontSize: 14, fontWeight: 300, color: COLORS_FIGMA.slate },
    goalBadge: {
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    goalBadgeText: { color: COLORS_FIGMA.primary, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' },

    mainGrid: { flexDirection: 'row', gap: 25, marginBottom: 30 },
    paramsCol: { width: '45%' },
    imageCol: { width: '55%', height: 200, borderRadius: 10, overflow: 'hidden' },
    goalImage: { width: '100%', height: '100%', objectFit: 'cover' },

    paramRow: { marginBottom: 15 },
    paramLabel: { fontSize: 9, color: COLORS_FIGMA.slate, marginBottom: 3, textTransform: 'uppercase' },
    paramValue: { fontSize: 13, fontWeight: 500, color: COLORS_FIGMA.dark },
    paramValueLarge: { fontSize: 18, fontWeight: 700, color: COLORS_FIGMA.primary },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },

    pensionGrid: { flexDirection: 'row', gap: 20, marginTop: 10 },
    pensionCol: { flex: 1 },
    pensionBigValue: { fontSize: 20, fontWeight: 700, color: COLORS_FIGMA.dark },
    pensionLabel: { fontSize: 9, color: COLORS_FIGMA.slate, textTransform: 'uppercase', marginBottom: 5 },

    footerGrid: { flexDirection: 'row', gap: 15 },
    portfolioCard: {
        flex: 1, padding: 15, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    },
    cardTitle: { fontSize: 10, fontWeight: 700, color: COLORS_FIGMA.dark, marginBottom: 10, minHeight: 25 },
    pItem: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 3,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    pName: { fontSize: 8, color: '#475569', flex: 1, marginRight: 5 },
    pValue: { fontSize: 8, fontWeight: 700, color: COLORS_FIGMA.dark },
});

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
};

const getSummaryTemplate = (data: any) => {
    const goals = data.goals_detailed || [];
    const hasGap = goals.some((g: any) => g.summary?.status === 'GAP');
    const clientName = data.client_info?.full_name?.split(' ')[0] || 'Клиент';

    if (hasGap) {
        return `Здравствуйте, ${clientName}! Я проанализировала ваши цели и текущие возможности. В плане обнаружен дефицит капитала для достижения некоторых целей. Мы рекомендуем рассмотреть увеличение ежемесячных взносов или использование налоговых льгот (ПДС), чтобы выйти на желаемый уровень дохода в будущем. Ваш план требует небольшой корректировки для 100% уверенности.`;
    }

    return `Здравствуйте, ${clientName}! Я проанализировала ваши финансовые цели. Ваш план выглядит отлично — текущая стратегия позволяет достичь всех поставленных задач в срок. Мы распределили активы таким образом, чтобы минимизировать риски и обеспечить стабильный рост капитала. Вы на верном пути к финансовой независимости!`;
};

const COLORS_PIE = ['#6B214C', '#A855F7', '#D8B4FE', '#F3E8FF', '#4C1D95', '#7C3AED'];

export const ReportPDF: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <Document><Page size="A4"><Text>No Data</Text></Page></Document>;

    const { client_info, overall_plan, goals_detailed, insurance_protection } = data;
    const clientName = client_info?.full_name || client_info?.fio || 'Клиент';
    const todayLabel = new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });

    const portfolioAlloc = overall_plan?.consolidated_portfolio?.assets_allocation || [];
    const pieData = portfolioAlloc.map((item: any, index: number) => ({
        name: item.name,
        value: item.share,
        color: COLORS_PIE[index % COLORS_PIE.length]
    })).filter((i: any) => i.value > 0);

    return (
        <Document>
            {/* 1. COVER PAGE */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverPage}>
                    <Image
                        src="public/assets/report_cover.png"
                        style={styles.coverImage}
                    />
                    <View style={styles.coverTitleBox}>
                        <Text style={styles.coverLabel}>ПЕРСОНАЛЬНОЕ ФИНАНСОВОЕ РЕШЕНИЕ</Text>
                        <Text style={styles.coverClientName}>{clientName}</Text>
                        <Text style={styles.coverDateText}>{todayLabel}</Text>
                    </View>
                </View>
            </Page>

            {/* 2. SUMMARY PAGE */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>Результаты анализа</Text>
                    <Text style={styles.headerPageNum}>02</Text>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.sectionTitle}>Резюме стратегии</Text>
                    <View style={styles.aiContainer}>
                        <View style={styles.aiAvatarBox}>
                            <Image
                                src="public/assets/ai_avatar.png"
                            />
                        </View>
                        <View style={styles.aiTextBox}>
                            <Text style={styles.aiLabel}>МНЕНИЕ ИИ-СОВЕТНИКА</Text>
                            <Text style={styles.aiMessage}>{getSummaryTemplate(data)}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Ваши цели</Text>
                    <View style={styles.goalsTable}>
                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.colName}>Цель</Text>
                            <Text style={styles.colDate}>Срок</Text>
                            <Text style={styles.colCost}>Стоимость</Text>
                        </View>
                        {goals_detailed?.map((goal: any, idx: number) => {
                            const cost = goal.summary?.target_amount_future || goal.summary?.target_amount_initial || 0;
                            const months = goal.summary?.target_months || 0;
                            const yearEnd = new Date().getFullYear() + Math.ceil(months / 12);
                            return (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={styles.colName}>{goal.goal_name || goal.name}</Text>
                                    <Text style={styles.colDate}>{months} мес. ({yearEnd} г.)</Text>
                                    <Text style={styles.colCost}>{formatCurrency(cost)}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {insurance_protection && insurance_protection.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Страховая защита</Text>
                            {insurance_protection.map((prog: any, i: number) => (
                                <View key={i} style={styles.insuranceCard}>
                                    <Text style={styles.insuranceName}>{prog.program_name}</Text>
                                    <View style={styles.riskGrid}>
                                        {prog.risks?.map((risk: any, j: number) => (
                                            <View key={j} style={styles.riskItem}>
                                                <Text style={styles.riskLabel}>{risk.risk_name}</Text>
                                                <Text style={styles.riskValue}>{formatCurrency(risk.limit_amount)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    <Text style={styles.sectionTitle}>Структура портфеля</Text>
                    <View style={styles.portfolioSection}>
                        <PdfPieChart data={pieData} size={150} hideLegend={true} />
                        <View style={styles.portfolioLegend}>
                            {portfolioAlloc.map((item: any, idx: number) => (
                                <View key={idx} style={styles.legendItem}>
                                    <Text style={styles.legendLabel}>{item.name}</Text>
                                    <Text style={styles.legendValue}>{item.share}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Page>

            {/* 3. DETAILED GOAL PAGES */}
            {goals_detailed?.map((goal: any, index: number) => {
                const name = goal.goal_name || goal.name;
                const summary = goal.summary || {};
                const details = goal.details || {};
                const months = summary.target_months || 0;
                const yearEnd = new Date().getFullYear() + Math.ceil(months / 12);
                const type = goal.goal_type || goal.type;

                const initialInstruments = details.portfolio_structure?.initial_instruments || details.instruments || [];
                const monthlyInstruments = details.portfolio_structure?.monthly_instruments || [];
                const imgUrl = getGoalImage(name, index);

                return (
                    <Page key={index} size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.headerLogo}>Финансовый план</Text>
                            <Text style={styles.headerPageNum}>{String(index + 3).padStart(2, '0')}</Text>
                        </View>

                        <View style={styles.contentContainer}>
                            <View style={styles.goalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.goalTitle}>{name}. {months > 0 ? `Январь ${yearEnd}г.` : ''}</Text>
                                    <Text style={styles.goalDate}>{months} месяцев до цели</Text>
                                </View>
                                <View style={styles.goalBadge}>
                                    <Text style={styles.goalBadgeText}>{type}</Text>
                                </View>
                            </View>

                            {type === 'PENSION' ? (
                                <View style={{ marginBottom: 30 }}>
                                    <View style={styles.pensionGrid}>
                                        <View style={styles.pensionCol}>
                                            <Text style={styles.pensionLabel}>В ценах сегодня</Text>
                                            <Text style={styles.pensionBigValue}>{formatCurrency(summary.state_pension_monthly_today || 0)}</Text>
                                        </View>
                                        <View style={styles.pensionCol}>
                                            <Text style={styles.pensionLabel}>В будущем (инфляция {summary.inflation_rate}%)</Text>
                                            <Text style={{ ...styles.pensionBigValue, color: COLORS_FIGMA.primary }}>{formatCurrency(summary.state_pension_monthly_future || 0)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.divider} />
                                </View>
                            ) : null}

                            <View style={styles.mainGrid}>
                                <View style={styles.paramsCol}>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Текущая стоимость</Text>
                                        <Text style={styles.paramValue}>{formatCurrency(summary.target_amount_initial || 0)}</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Будущая стоимость</Text>
                                        <Text style={styles.paramValueLarge}>{formatCurrency(summary.target_amount_future || 0)}</Text>
                                    </View>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Ежемесячное пополнение</Text>
                                        <Text style={styles.paramValueLarge}>{formatCurrency(summary.monthly_replenishment || 0)}</Text>
                                    </View>
                                </View>
                                <View style={styles.imageCol}>
                                    {imgUrl && <Image src={imgUrl} style={styles.goalImage} />}
                                </View>
                            </View>

                            <View style={styles.footerGrid}>
                                <View style={styles.portfolioCard}>
                                    <Text style={styles.cardTitle}>Стартовый капитал</Text>
                                    {initialInstruments.map((inst: any, idx: number) => (
                                        <View key={idx} style={styles.pItem}>
                                            <Text style={styles.pName}>{inst.name}</Text>
                                            <Text style={styles.pValue}>{formatCurrency(inst.amount)}</Text>
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.portfolioCard}>
                                    <Text style={styles.cardTitle}>Ежемесячный поток</Text>
                                    {monthlyInstruments.length > 0 ? monthlyInstruments.map((inst: any, idx: number) => (
                                        <View key={idx} style={styles.pItem}>
                                            <Text style={styles.pName}>{inst.name}</Text>
                                            <Text style={styles.pValue}>{formatCurrency(inst.amount)}</Text>
                                        </View>
                                    )) : <Text style={{ fontSize: 8, color: COLORS_FIGMA.slate }}>Аналогично стартовому</Text>}
                                </View>
                            </View>
                        </View>
                    </Page>
                );
            })}
        </Document>
    );
};
