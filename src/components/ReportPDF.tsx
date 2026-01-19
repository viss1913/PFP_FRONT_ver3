import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

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
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    coverPage: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
    },
    coverImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    coverContent: {
        position: 'absolute',
        bottom: 100,
        left: 40,
        right: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        borderRadius: 8,
    },
    coverTitle: {
        fontSize: 32,
        fontWeight: 700,
        color: '#0F172A', // Dark Slate
        marginBottom: 10,
    },
    coverSubtitle: {
        fontSize: 18,
        color: '#475569',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        alignItems: 'center',
    },
    headerLogo: {
        fontSize: 14,
        fontWeight: 700,
        color: '#C2185B',
    },
    content: {
        padding: 40,
    },
    heading1: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 20,
        color: '#1E293B',
        borderBottomWidth: 2,
        borderBottomColor: '#C2185B',
        paddingBottom: 5,
    },
    heading2: {
        fontSize: 18,
        fontWeight: 500,
        marginBottom: 10,
        marginTop: 20,
        color: '#334155',
    },
    text: {
        fontSize: 11,
        lineHeight: 1.5,
        color: '#475569',
        marginBottom: 8,
    },
    card: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: 10,
        color: '#64748B',
    },
    value: {
        fontSize: 10,
        fontWeight: 500,
        color: '#0F172A',
    },
    valueLarge: {
        fontSize: 14,
        fontWeight: 700,
        color: '#C2185B',
    },
    goalCard: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 5,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#0F172A',
    },
    goalType: {
        fontSize: 12,
        color: '#94A3B8',
    },
    gridTwo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    }
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
    const calcRoot = data?.calculation || data || {};
    const calculatedGoals = calcRoot.goals || [];

    // Tax Summary
    const taxBenefitsSummary = (data?.summary?.tax_benefits_summary || calcRoot?.summary?.tax_benefits_summary) || {};
    const taxTotals = taxBenefitsSummary?.totals || {};

    return (
        <Document>
            {/* Cover Page */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverPage}>
                    <Image
                        src="/assets/cover.png"
                        style={styles.coverImage}
                    />
                    <View style={styles.coverContent}>
                        <Text style={styles.coverTitle}>Личный Финансовый План</Text>
                        <Text style={styles.coverSubtitle}>Стратегия достижения ваших целей</Text>
                        <Text style={styles.text}>Подготовлено для: {clientName}</Text>
                        <Text style={styles.text}>Дата: {new Date().toLocaleDateString('ru-RU')}</Text>
                    </View>
                </View>
            </Page>

            {/* Intro and Executive Summary */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>AI FINANCIAL PLANNER</Text>
                    <Text style={styles.text}>{new Date().toLocaleDateString('ru-RU')}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.heading1}>Резюме плана</Text>
                    <Text style={styles.text}>
                        В данном отчете представлен детальный анализ вашей финансовой ситуации и предложена стратегия для достижения поставленных целей.
                        Мы учли ваши текущие активы, доходы и склонность к риску.
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.heading2}>Ключевые показатели</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Количество целей:</Text>
                            <Text style={styles.value}>{calculatedGoals.length}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Налоговые вычеты (2026):</Text>
                            <Text style={styles.valueLarge}>{formatCurrency(taxTotals.deduction_2026 || 0)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Общий эффект от вычетов:</Text>
                            <Text style={styles.valueLarge}>{formatCurrency(taxTotals.total_deductions || 0)}</Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* Goals Detail */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>ФИНАНСОВЫЕ ЦЕЛИ</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.heading1}>Детализация целей</Text>

                    {calculatedGoals.map((goal: any, index: number) => {
                        const summary = goal.summary || {};
                        const details = goal.details || {};
                        const cost = details.target_capital_required || details.target_amount || summary.target_amount || 0;
                        const monthly = summary.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0);

                        return (
                            <View key={index} style={styles.goalCard}>
                                <View style={styles.goalHeader}>
                                    <Text style={styles.goalTitle}>{goal.goal_name || `Цель ${index + 1}`}</Text>
                                    <Text style={styles.goalType}>{goal.goal_type}</Text>
                                </View>
                                <View style={styles.gridTwo}>
                                    <View style={{ width: '45%' }}>
                                        <Text style={styles.label}>Стоимость цели:</Text>
                                        <Text style={styles.valueLarge}>{formatCurrency(cost)}</Text>
                                    </View>
                                    <View style={{ width: '45%' }}>
                                        <Text style={styles.label}>Ежемес. взнос:</Text>
                                        <Text style={styles.valueLarge}>{formatCurrency(monthly)}</Text>
                                    </View>
                                    <View style={{ width: '45%', marginTop: 10 }}>
                                        <Text style={styles.label}>Начальный капитал:</Text>
                                        <Text style={styles.value}>{formatCurrency(summary.initial_capital || 0)}</Text>
                                    </View>
                                    <View style={{ width: '45%', marginTop: 10 }}>
                                        <Text style={styles.label}>Срок (мес):</Text>
                                        <Text style={styles.value}>{details.term_months || summary.term_months || 0}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </Page>

            {/* Portfolio & Tax (Simplified placeholder if charts needed) */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>ПОРТФЕЛЬ И НАЛОГИ</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.heading1}>Структура портфеля</Text>
                    <Text style={styles.text}>
                        Ваш портфель диверсифицирован для оптимизации соотношения риска и доходности.
                        (Здесь могла бы быть диаграмма распределения активов)
                    </Text>

                    <View style={{ height: 20 }}></View>

                    <Text style={styles.heading1}>Налоговые льготы</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Вычет на взносы (ежегодно):</Text>
                            <Text style={styles.value}>до {formatCurrency(400000)} (ИИС типа А)</Text>
                        </View>
                        {taxTotals.cofinancing_2026 > 0 && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Программа софинансирования:</Text>
                                <Text style={styles.value}>Активна на {new Date().getFullYear() + 1} год</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
