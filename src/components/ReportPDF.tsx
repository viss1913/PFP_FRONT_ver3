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
        backgroundColor: '#1E293B', // Dark fallback
    },
    coverImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.8,
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
    },
    coverContent: {
        position: 'absolute',
        bottom: 80,
        left: 40,
        right: 40,
    },
    coverTitle: {
        fontSize: 42,
        fontWeight: 700,
        color: '#FFFFFF',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    coverSubtitle: {
        fontSize: 24,
        fontWeight: 300,
        color: '#E2E8F0',
        marginBottom: 40,
    },
    coverDivider: {
        height: 4,
        width: 80,
        backgroundColor: '#C2185B', // Primary brand color
        marginBottom: 30,
    },
    coverMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
        paddingTop: 20,
    },
    coverMetaItem: {
        flexDirection: 'column',
    },
    coverMetaLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    coverMetaValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: 500,
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
        padding: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 700,
        color: '#1E293B',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#C2185B',
        paddingLeft: 10,
    },
    aiSummaryBox: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 8,
        marginBottom: 30,
    },
    aiSummaryText: {
        fontSize: 11,
        lineHeight: 1.6,
        color: '#334155',
        textAlign: 'justify',
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
    colCost: { width: '25%', fontSize: 10, color: '#334155', textAlign: 'right', fontWeight: 700 },

    // Portfolio Section
    portfolioSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        backgroundColor: '#F8FAFC',
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
    legendLabel: { fontSize: 10, color: '#475569' },
    legendValue: { fontSize: 10, fontWeight: 700, color: '#1E293B' },

    // --- GOAL PAGE STYLES ---
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#F1F5F9',
    },
    goalTitleBlock: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 28,
        fontWeight: 700,
        color: '#1E293B',
        marginBottom: 5,
    },
    goalDate: {
        fontSize: 18,
        fontWeight: 300,
        color: '#64748B',
    },
    goalBadge: {
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 20,
    },
    goalBadgeText: {
        color: '#C2185B',
        fontWeight: 700,
        fontSize: 12,
        textTransform: 'uppercase',
    },

    // Main Grid
    mainGrid: {
        flexDirection: 'row',
        gap: 30,
        marginBottom: 40,
    },
    paramsCol: {
        width: '40%',
    },
    imageCol: {
        width: '60%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
    },
    goalImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },

    // Parameter Row
    paramRow: {
        marginBottom: 20,
    },
    paramLabel: {
        fontSize: 10,
        color: '#94A3B8',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    paramValue: {
        fontSize: 16,
        fontWeight: 500,
        color: '#1E293B',
    },
    paramValueLarge: {
        fontSize: 22,
        fontWeight: 700,
        color: '#1E293B',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 10,
    },

    // Footer Portfolios
    footerGrid: {
        flexDirection: 'row',
        gap: 20,
    },
    portfolioCard: {
        flex: 1,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 700,
        color: '#1E293B',
        marginBottom: 15,
        minHeight: 30, // Align titles
    },
    pItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pName: { fontSize: 10, color: '#475569', flex: 1, marginRight: 10 },
    pValue: { fontSize: 10, fontWeight: 700, color: '#1E293B' },
});

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
};

const COLORS = ['#C2185B', '#E91E63', '#F06292', '#F8BBD0', '#880E4F', '#AD1457'];

// Interface for Portfolio Instrument
interface PortfolioInstrument {
    name: string;
    share?: number;
    amount: number;
}

export const ReportPDF: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <Document><Page size="A4"><Text>No Data</Text></Page></Document>;

    const { client_info, client_profile, ai_executive_summary, overall_plan, goals_detailed } = data;

    const clientName = client_info?.full_name || client_profile?.full_name || client_info?.fio || 'Клиент';
    const today = new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });

    // Portfolio Chart Data
    const portfolioAlloc = overall_plan?.consolidated_portfolio?.assets_allocation || [];
    const pieData = portfolioAlloc.map((item: any, index: number) => ({
        name: item.name,
        value: item.share,
        color: COLORS[index % COLORS.length]
    })).filter((i: any) => i.value > 0);

    return (
        <Document>
            {/* 1. COVER PAGE */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverPage}>
                    <Image
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
                        style={styles.coverImage}
                    />
                    <View style={styles.coverOverlay} />

                    <View style={styles.coverContent}>
                        <View style={styles.coverDivider} />
                        <Text style={styles.coverTitle}>Личный Финансовый План</Text>
                        <Text style={styles.coverSubtitle}>Стратегия достижения ваших целей</Text>

                        <View style={styles.coverMetaContainer}>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Клиент</Text>
                                <Text style={styles.coverMetaValue}>{clientName}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Дата</Text>
                                <Text style={styles.coverMetaValue}>{today}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Советник</Text>
                                <Text style={styles.coverMetaValue}>AI Financial Planner</Text>
                            </View>
                        </View>
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
                    {/* AI Intro */}
                    <Text style={styles.sectionTitle}>Резюме стратегии</Text>
                    {ai_executive_summary && (
                        <View style={styles.aiSummaryBox}>
                            <Text style={styles.aiSummaryText}>{ai_executive_summary.replace(/[*_#]/g, '')}</Text>
                        </View>
                    )}

                    {/* Goals Overview */}
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

                    {/* Portfolio Chart */}
                    <Text style={styles.sectionTitle}>Структура портфеля</Text>
                    <View style={styles.portfolioSection}>
                        <PdfPieChart data={pieData} size={180} hideLegend={true} />
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
                const type = goal.goal_type || 'GOAL';

                // Data Extraction
                const currentDiff = summary.target_amount_initial || 0;
                const futureValue = summary.target_amount_future || currentDiff;
                const months = summary.target_months || 0;
                const yearEnd = new Date().getFullYear() + Math.ceil(months / 12);
                const inflation = summary.inflation_rate || 0;
                const initialCap = summary.initial_capital || 0;
                const monthlyPay = summary.monthly_replenishment || 0;

                // Portfolio Data
                const initialInstruments = details.portfolio_structure?.initial_instruments || details.instruments || [];
                const monthlyInstruments = details.portfolio_structure?.monthly_instruments || [];

                // Image
                const imgUrl = getGoalImage(name, index);

                return (
                    <Page key={index} size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.headerLogo}>Финансовый план</Text>
                            <Text style={styles.headerPageNum}>{String(index + 3).padStart(2, '0')}</Text>
                        </View>

                        <View style={styles.contentContainer}>
                            {/* GOAL HEADER */}
                            <View style={styles.goalHeader}>
                                <View style={styles.goalTitleBlock}>
                                    <Text style={styles.goalTitle}>{name}. {months > 0 ? `Январь ${yearEnd}г.` : ''}</Text>
                                    <Text style={styles.goalDate}>{months} месяцев до цели</Text>
                                </View>
                                <View style={styles.goalBadge}>
                                    <Text style={styles.goalBadgeText}>Цель {index + 1}</Text>
                                </View>
                            </View>

                            {/* MAIN GRID */}
                            <View style={styles.mainGrid}>
                                <View style={styles.paramsCol}>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Текущая стоимость</Text>
                                        <Text style={styles.paramValue}>{formatCurrency(currentDiff)}</Text>
                                    </View>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Инфляция, в год</Text>
                                        <Text style={styles.paramValue}>{inflation}%</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Стоимость с учетом инфляции</Text>
                                        <Text style={styles.paramValueLarge}>{formatCurrency(futureValue)}</Text>
                                    </View>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Первоначальный капитал</Text>
                                        <Text style={styles.paramValue}>{formatCurrency(initialCap)}</Text>
                                    </View>
                                    <View style={styles.paramRow}>
                                        <Text style={styles.paramLabel}>Рекомендованное пополнение</Text>
                                        <Text style={styles.paramValueLarge}>{formatCurrency(monthlyPay)}</Text>
                                    </View>
                                </View>

                                <View style={styles.imageCol}>
                                    {imgUrl && <Image src={imgUrl} style={styles.goalImage} />}
                                </View>
                            </View>

                            {/* FOOTER - PORTFOLIOS */}
                            <View style={styles.footerGrid}>
                                {/* Portfolio 1: Initial Capital */}
                                <View style={styles.portfolioCard}>
                                    <Text style={styles.cardTitle}>Портфель для первоначального капитала</Text>
                                    {initialInstruments.length > 0 ? (
                                        initialInstruments.map((inst: PortfolioInstrument, idx: number) => (
                                            <View key={idx} style={styles.pItem}>
                                                <Text style={styles.pName}>{inst.name}</Text>
                                                <Text style={styles.pValue}>{formatCurrency(inst.amount)}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>Нет данных</Text>
                                    )}
                                </View>

                                {/* Portfolio 2: Monthly Capital */}
                                <View style={styles.portfolioCard}>
                                    <Text style={styles.cardTitle}>Портфель для ежемесячного пополнения</Text>
                                    {monthlyInstruments.length > 0 ? (
                                        monthlyInstruments.map((inst: PortfolioInstrument, idx: number) => (
                                            <View key={idx} style={styles.pItem}>
                                                <Text style={styles.pName}>{inst.name}</Text>
                                                <Text style={styles.pValue}>{formatCurrency(inst.amount)}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>Пополняется в те же инструменты</Text>
                                    )}
                                </View>
                            </View>

                        </View>
                    </Page>
                );
            })}
        </Document>
    );
};
