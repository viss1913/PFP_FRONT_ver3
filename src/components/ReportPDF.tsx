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
    coverPage: {
        height: '100%',
        position: 'relative',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
    },
    coverImage: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%', objectFit: 'cover', opacity: 0.6
    },
    coverContent: {
        position: 'absolute', bottom: 0, left: 0, right: 0, top: '50%', padding: 40, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.9)'
    },
    coverTitle: {
        fontSize: 36, fontWeight: 700, marginBottom: 10, color: '#FFFFFF'
    },
    coverSubtitle: {
        fontSize: 20, marginBottom: 30, color: '#CBD5E1'
    },
    coverMeta: {
        fontSize: 12, color: '#94A3B8', marginTop: 5
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', padding: '20 40', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center', marginTop: 10
    },
    headerLogo: {
        fontSize: 10, fontWeight: 700, color: '#C2185B', textTransform: 'uppercase'
    },
    pageNumber: {
        fontSize: 10, color: '#94A3B8'
    },
    content: {
        padding: 40, flex: 1
    },
    heading1: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#0F172A' },
    heading2: { fontSize: 16, fontWeight: 700, marginBottom: 15, marginTop: 10, color: '#334155' },
    text: { fontSize: 11, lineHeight: 1.5, color: '#475569', marginBottom: 8 },
    card: {
        backgroundColor: '#F8FAFC', borderRadius: 8, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0',
    },
    gridTwo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
    label: { fontSize: 10, color: '#64748B', marginBottom: 2 },
    value: { fontSize: 12, fontWeight: 500, color: '#0F172A' },
    valueLarge: { fontSize: 24, fontWeight: 700, color: '#C2185B' },
    aiBox: {
        backgroundColor: '#F0FDF4', padding: 15, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: '#16A34A', marginBottom: 20
    },
    aiLabel: { fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: 5 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 8, alignItems: 'center' },
    tableHeader: { backgroundColor: '#F8FAFC', fontWeight: 700, fontSize: 10, color: '#475569' },
    colName: { width: '60%', fontSize: 10 },
    colValue: { width: '40%', fontSize: 10, textAlign: 'right' },
});

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
};

const COLORS = ['#C2185B', '#E91E63', '#F06292', '#F8BBD0', '#880E4F', '#AD1457'];

export const ReportPDF: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <Document><Page><Text>No Data</Text></Page></Document>;

    const { client_info, client_profile, ai_executive_summary, current_situation, overall_plan, goals_detailed } = data;

    // Normalize Client Info
    const rawClient = client_info || client_profile || {};
    const normalizedClient = {
        fio: rawClient.fio || rawClient.full_name || 'Клиент',
        // ... other fields if needed for PDF
    };

    const today = new Date().toLocaleDateString('ru-RU');

    // Portfolio Data
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
                        src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2000"
                        style={styles.coverImage}
                    />
                    <View style={styles.coverContent}>
                        <Text style={styles.coverTitle}>Личный Финансовый План</Text>
                        <Text style={styles.coverSubtitle}>Стратегия достижения ваших целей</Text>
                        <View style={{ height: 2, width: 100, backgroundColor: '#C2185B', marginBottom: 20 }}></View>
                        <Text style={styles.coverMeta}>Клиент: {normalizedClient.fio}</Text>
                        <Text style={styles.coverMeta}>Дата составления: {today}</Text>
                    </View>
                </View>
            </Page>

            {/* 2. EXECUTIVE SUMMARY & HEALTH */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>AI Financial Planner</Text>
                    <Text style={styles.pageNumber}>Резюме</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.heading1}>Резюме Эксперта</Text>

                    {/* AI Executive Summary */}
                    {ai_executive_summary && (
                        <View style={styles.aiBox}>
                            <Text style={styles.aiLabel}>Мнение ИИ-Советника</Text>
                            <Text style={styles.text}>{ai_executive_summary.replace(/[*_#]/g, '')}</Text>
                        </View>
                    )}

                    <Text style={styles.heading2}>Текущее финансовое состояние</Text>
                    <View style={styles.gridTwo}>
                        <View style={{ ...styles.card, width: '30%' }}>
                            <Text style={styles.label}>Активы</Text>
                            <Text style={styles.valueLarge}>{formatCurrency(current_situation?.assets_total || 0)}</Text>
                        </View>
                        <View style={{ ...styles.card, width: '30%' }}>
                            <Text style={styles.label}>Обязательства</Text>
                            <Text style={{ ...styles.valueLarge, color: '#DC2626' }}>{formatCurrency(current_situation?.liabilities_total || 0)}</Text>
                        </View>
                        <View style={{ ...styles.card, width: '30%' }}>
                            <Text style={styles.label}>Чистый капитал</Text>
                            <Text style={{ ...styles.valueLarge, color: '#059669' }}>{formatCurrency(current_situation?.net_worth || 0)}</Text>
                        </View>
                    </View>

                    <Text style={styles.heading2}>Структура портфеля</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <PdfPieChart data={pieData} size={150} />
                        <View style={{ flex: 1, marginLeft: 20 }}>
                            {portfolioAlloc.map((item: any, idx: number) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text style={{ fontSize: 10, color: '#334155' }}>{item.name}</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 700 }}>{item.share}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Page>

            {/* 3. GOALS DETAILED */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerLogo}>Детализация по целям</Text>
                    <Text style={styles.pageNumber}>План</Text>
                </View>
                <View style={styles.content}>
                    {goals_detailed?.map((goal: any, index: number) => {
                        const name = goal.goal_name || goal.name;
                        const type = goal.goal_type || goal.type;
                        const summary = goal.summary || {};
                        const monthlyPayment = summary.monthly_replenishment || goal.monthly_payment || 0;
                        const term = summary.target_months || goal.term_months || 0;
                        const projected = summary.projected_capital_at_end || summary.projected_capital_at_retirement || goal.projected_amount || 0;

                        const img = getGoalImage(name, 0);
                        return (
                            <View key={index} style={{ marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 20 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                                    {img && (
                                        <Image src={img} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 15, objectFit: 'cover' }} />
                                    )}
                                    <View>
                                        <Text style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>{type}</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{name}</Text>
                                    </View>
                                </View>

                                <View style={styles.gridTwo}>
                                    <View style={{ width: '30%' }}>
                                        <Text style={styles.label}>Ежемесячный платеж</Text>
                                        <Text style={styles.value}>{formatCurrency(monthlyPayment)}</Text>
                                    </View>
                                    <View style={{ width: '30%' }}>
                                        <Text style={styles.label}>Срок</Text>
                                        <Text style={styles.value}>{term} мес.</Text>
                                    </View>
                                    <View style={{ width: '30%' }}>
                                        <Text style={styles.label}>Прогноз накоплений</Text>
                                        <Text style={styles.value}>{formatCurrency(projected)}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </Page>
        </Document>
    );
};
