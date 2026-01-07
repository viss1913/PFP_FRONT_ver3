import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, ShieldCheck, Briefcase, PiggyBank, DollarSign } from 'lucide-react';
import StepClientData from './steps/StepClientData';
import StepGoalSelection from './steps/StepGoalSelection';
import StepAssets from './steps/StepAssets';
import StepFinReserve from './steps/StepFinReserve';
import StepIncome from './steps/StepIncome';
import StepRiskProfile from './steps/StepRiskProfile';
import { clientApi } from '../api/clientApi';
import type { Asset, ClientGoal } from '../types/client';

interface CJMFlowProps {
    onComplete: (result: any) => void;
    initialData?: {
        fio?: string;
        phone?: string;
        uuid?: string;
    };
    clientId?: number;
    onBack?: () => void;
}

export interface CJMData {
    // ... existing fields ...
    gender: 'male' | 'female';
    age: number;
    // Legacy single-goal fields (deprecated but kept for compatibility during refactor)
    goalTypeId?: number;
    goalName?: string;
    targetAmount?: number;
    termMonths?: number;
    initialCapital?: number;
    monthlyReplenishment?: number;

    // Global Financials
    avgMonthlyIncome: number;
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

    // v3 New Structures
    assets?: Asset[];
    goals?: ClientGoal[];

    // Identifiers
    fio?: string;
    phone?: string;
    uuid?: string;
}

const CJMFlow: React.FC<CJMFlowProps> = ({ onComplete, initialData, clientId, onBack }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CJMData>({
        gender: 'male',
        age: 39,
        goalTypeId: 3,
        goalName: 'Инвестиции',
        targetAmount: 1500000,
        termMonths: 60,
        initialCapital: 100000,
        monthlyReplenishment: 50000,
        avgMonthlyIncome: 150000,
        riskProfile: 'BALANCED',
        ...initialData
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            // Split FIO into parts
            const fioParts = (data.fio || '').split(' ');
            const firstName = fioParts[0] || 'Unknown';
            const lastName = fioParts[1] || 'Unknown';
            const middleName = fioParts[2] || '';

            // Calculate Total Liquid Capital from Assets
            const assetsInitial = (data.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);

            // Construct Goals Payload - фильтруем НСЖ (id=5), не отправляем на расчет
            let goalsToProcess = (data.goals || []).filter(g => g.goal_type_id !== 5);

            // Автоматически добавляем FIN_RESERVE (id=7), если указаны initialCapital или monthlyReplenishment в StepFinReserve
            // и еще нет цели FIN_RESERVE в списке
            const hasFinReserveGoal = goalsToProcess.some(g => g.goal_type_id === 7);
            if (!hasFinReserveGoal && (data.initialCapital || data.monthlyReplenishment)) {
                goalsToProcess.push({
                    goal_type_id: 7,
                    name: 'Финансовый резерв',
                    initial_capital: data.initialCapital || 0,
                    monthly_replenishment: data.monthlyReplenishment || 0,
                    term_months: 12, // FIN_RESERVE всегда 12 месяцев
                    risk_profile: 'CONSERVATIVE'
                });
            }

            const goalsPayload = goalsToProcess.map(g => {
                // Определяем типы целей сначала
                const isRent = g.goal_type_id === 8;
                const isFinReserve = g.goal_type_id === 7;
                const isInvestment = g.goal_type_id === 3;
                const isPension = g.goal_type_id === 1; // PENSION
                const isPassiveIncome = g.goal_type_id === 2; // PASSIVE_INCOME

                // Only for FIN_RESERVE (id=7) and RENT (id=8), use initial_capital from goal itself
                // For other goals, бэк сам распределит из активов - не передаем initial_capital
                const initialCapital = (isFinReserve || isRent)
                    ? (g.initial_capital || 0)
                    : undefined; // Не передаем для остальных целей - бэк сам распределит

                // monthly_replenishment передаем только для Investment (id=3) и FIN_RESERVE (id=7)
                // Для остальных целей (PASSIVE_INCOME, PENSION, RENT и др.) не передаем
                const monthlyReplenishment = (isFinReserve || isInvestment)
                    ? (g.monthly_replenishment !== undefined ? g.monthly_replenishment : (data.monthlyReplenishment || undefined))
                    : undefined;

                const payload: any = {
                    goal_type_id: g.goal_type_id,
                    name: g.name,
                    risk_profile: (g.risk_profile || data.riskProfile || 'BALANCED') as "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE",
                    inflation_rate: g.inflation_rate || 10
                };

                // Для PENSION и PASSIVE_INCOME: target_amount = desired_monthly_income, term_months не нужен
                if (isPension || isPassiveIncome) {
                    payload.target_amount = g.desired_monthly_income || 0;
                    payload.term_months = g.term_months || 120; // Все равно нужен для API, но бэк может игнорировать
                    if (g.desired_monthly_income !== undefined) {
                        payload.desired_monthly_income = g.desired_monthly_income;
                    }
                } else {
                    // Для остальных целей
                    payload.target_amount = isRent ? (g.initial_capital || 0) : (isFinReserve ? (g.initial_capital || 0) : (g.insurance_limit || g.target_amount || 0));
                    payload.term_months = isRent ? 12 : (isFinReserve ? 12 : (g.term_months || 120));
                }

                // Только для FIN_RESERVE и RENT передаем initial_capital
                if (initialCapital !== undefined) {
                    payload.initial_capital = initialCapital;
                }

                // Только для FIN_RESERVE (id=7) и Investment (id=3) передаем monthly_replenishment
                if (monthlyReplenishment !== undefined) {
                    payload.monthly_replenishment = monthlyReplenishment;
                }

                return payload;
            });

            // Fallback for legacy flow if no goals (should not happen with new UI)
            if (goalsPayload.length === 0 && data.goalTypeId) {
                goalsPayload.push({
                    goal_type_id: data.goalTypeId!,
                    name: data.goalName!,
                    target_amount: data.targetAmount || 0,
                    term_months: data.termMonths || 120,
                    risk_profile: data.riskProfile,
                    initial_capital: data.initialCapital || 0,
                    monthly_replenishment: undefined,
                    inflation_rate: 10,
                    desired_monthly_income: undefined
                });
            }

            const payload = {
                goals: goalsPayload,
                client: {
                    birth_date: new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
                    sex: data.gender,
                    avg_monthly_income: data.avgMonthlyIncome,
                    total_liquid_capital: assetsInitial,
                    // New fields
                    first_name: firstName,
                    last_name: lastName,
                    middle_name: middleName,
                    phone: data.phone,
                    external_uuid: data.uuid,
                    // If editing, might need ID, but usually handled by URL parameter in PUT
                },
                // Pass existing assets if needed, or if the API requires full replacement
                assets: (data.assets || []).map(a => ({
                    // Map frontend Asset to API ClientAsset
                    type: a.type,
                    name: a.name,
                    current_value: a.current_value,
                    currency: a.currency || 'RUB',
                    // Default fields for now
                    start_date: new Date().toISOString().split('T')[0],
                    risk_level: 'conservative'
                })),
                liabilities: [],
                expenses: []
            };

            let response;
            if (clientId) {
                // UPDATE existing client + Calculate
                // 1. Update Profile (using clientApi which has auth)
                await clientApi.updateClient(clientId, payload.client);

                // 2. Calculate (using clientApi)
                response = await clientApi.calculate({
                    goals: payload.goals,
                    client: payload.client
                });

            } else {
                // NEW Client (using clientApi)
                response = await clientApi.firstRun(payload);
            }

            onComplete(response);
        } catch (error) {
            console.error('Calculation error:', error);
            alert('Ошибка при расчете. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Личные данные', icon: <User size={20} /> },
        { title: 'Цели', icon: <Target size={20} /> },
        { title: 'Активы', icon: <Briefcase size={20} /> },
        { title: 'Финрезерв', icon: <PiggyBank size={20} /> },
        { title: 'Доход', icon: <DollarSign size={20} /> },
        { title: 'Риск-профиль', icon: <ShieldCheck size={20} /> }
    ];

    useEffect(() => {
        // If editing, fetch client data
        if (clientId) {
            // Need to fetch client details and pre-fill `data`
            // Ideally should be done in a useEffect with async call
            // Using a self-executing function or just simpler here
            const loadClient = async () => {
                try {
                    const client = await clientApi.getClient(clientId);
                    // Map API client to CJMData
                    setData(prev => ({
                        ...prev,
                        gender: client.sex || 'male',
                        age: client.birth_date ? new Date().getFullYear() - new Date(client.birth_date).getFullYear() : 35,
                        fio: `${client.first_name || ''} ${client.last_name || ''} ${client.middle_name || ''}`.trim(),
                        phone: client.phone,
                        uuid: client.external_uuid,
                        avgMonthlyIncome: client.avg_monthly_income || 150000,
                        // Note: Goals are not easily mapped 1-to-1 to the single-goal flow without more logic
                        // We'll keep the goal defaults for now or take the first one if exists
                    }));
                } catch (e) {
                    console.error("Failed to load client", e);
                }
            };
            loadClient();
        }
    }, [clientId]);

    // Dynamic styles based on step
    const isWideStep = step === 2; // Goal Selection needs full width
    const containerStyle: React.CSSProperties = isWideStep ? {
        width: '100%',
        margin: '0',
        padding: '0' // Strictly ZERO padding here, handled by .goalsContainer
    } : {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px'
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                {onBack && (
                    <div
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            left: isWideStep ? '40px' : '20px', // Adjust back button for wide layout
                            top: '40px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}
                    >
                        ← Назад
                    </div>
                )}
                {steps.map((s, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: step > i + 1 ? 'var(--secondary)' : step === i + 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: step === i + 1 ? '#000' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '12px', color: step === i + 1 ? 'var(--primary)' : 'var(--text-muted)' }}>{s.title}</span>
                        {i < steps.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: 'calc(50% + 25px)',
                                right: 'calc(-50% + 25px)',
                                height: '2px',
                                background: step > i + 1 ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'
                            }} />
                        )}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="premium-card"
                >
                    {step === 1 && <StepClientData data={data} setData={setData} onNext={nextStep} />}
                    {step === 2 && <StepGoalSelection data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 3 && <StepAssets data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 4 && <StepFinReserve data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 5 && <StepIncome data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 6 && <StepRiskProfile data={data} setData={setData} onComplete={handleCalculate} onPrev={prevStep} loading={loading} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CJMFlow;
