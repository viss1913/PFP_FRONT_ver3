import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, ShieldCheck, Briefcase, PiggyBank, Heart, Users } from 'lucide-react';
import StepClientData from './steps/StepClientData';
import StepFamilyProfile from './steps/StepFamilyProfile';
import StepGoalSelection from './steps/StepGoalSelection';
import StepAssets from './steps/StepAssets';
import StepFinReserve from './steps/StepFinReserve';
import StepLifeInsurance from './steps/StepLifeInsurance';
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
    birthDate?: string;
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

    // Life Insurance
    lifeInsuranceLimit?: number;
    familyProfile: {
        marital_status: '' | 'single' | 'married' | 'divorced' | 'widowed' | 'civil_union';
        children: Array<{ first_name: string; birth_date: string }>;
        contacts: Array<{ name: string; relation: string; phone?: string; email?: string }>;
        spouse?: { employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'other'; monthly_income?: number | null };
        family_obligations: Array<{ type: FamilyObligation; amount_monthly: number }>;
        real_estate: Array<{ name?: string; estimated_value: number; status: FamilyRealEstateStatus }>;
        confidentiality: { allow_spouse_access: boolean; allow_family_contact: boolean; notes?: string };
    };
    riskProfileAnswers: Partial<Record<'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9' | 'q10', number>>;
}

export type FamilyObligation =
    | 'loans'
    | 'mortgage'
    | 'rent'
    | 'alimony'
    | 'education'
    | 'elder_support'
    | 'other';
export type FamilyRealEstateStatus = 'owned' | 'mortgage';

/** Тот же пул, что в StepLifeInsurance / StepFinReserve. */
function clientPoolCapitalForLifeStep(d: CJMData): number {
    const assetsCapital = (d.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);
    const investmentOrRentGoalCapital = (d.goals || [])
        .filter((g) => g.goal_type_id === 3 || g.goal_type_id === 8)
        .reduce((sum, g) => sum + (g.initial_capital || 0), 0);
    return assetsCapital > 0 ? assetsCapital : investmentOrRentGoalCapital;
}

const CAPITAL_FLOOR_LIFE_INSURANCE = 500_000;

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
        monthlyReplenishment: 5000,
        avgMonthlyIncome: 150000,
        riskProfile: 'BALANCED',
        lifeInsuranceLimit: 0,
        familyProfile: {
            marital_status: 'married',
            children: [],
            contacts: [],
            spouse: {},
            family_obligations: [{ type: 'loans', amount_monthly: 0 }],
            real_estate: [],
            confidentiality: {
                allow_spouse_access: false,
                allow_family_contact: false,
                notes: ''
            }
        },
        riskProfileAnswers: {},
        ...initialData
    });

    const shouldSkipAssetsStep = (): boolean => {
        const goalIds = (data.goals || []).map((g) => g.goal_type_id);
        return goalIds.includes(3) || goalIds.includes(8);
    };

    const shouldSkipLifeInsuranceStep = (): boolean =>
        clientPoolCapitalForLifeStep(data) < CAPITAL_FLOOR_LIFE_INSURANCE;

    const nextStep = () => {
        setStep((s) => {
            if (s === 3 && shouldSkipAssetsStep()) return 5;
            if (s === 5 && shouldSkipLifeInsuranceStep()) return 7;
            return s + 1;
        });
    };
    const prevStep = () => {
        setStep((s) => {
            if (s === 5 && shouldSkipAssetsStep()) return 3;
            if (s === 7 && shouldSkipLifeInsuranceStep()) return 5;
            return s - 1;
        });
    };

    useLayoutEffect(() => {
        if (step === 6 && clientPoolCapitalForLifeStep(data) < CAPITAL_FLOOR_LIFE_INSURANCE) {
            setStep(7);
        }
    }, [step, data]);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            // Split FIO into parts
            const fioParts = (data.fio || '').split(' ');
            const firstName = fioParts[0] || 'Unknown';
            const lastName = fioParts[1] || 'Unknown';
            const middleName = fioParts[2] || '';

            // If assets step was skipped, infer CASH asset from goal initial capital (INVESTMENT).
            const inferredCashFromGoals = Math.max(
                0,
                ...(data.goals || [])
                    .filter((g) => g.goal_type_id === 3 || g.goal_type_id === 8)
                    .map((g) => g.initial_capital || 0)
            );
            const normalizedAssets = (data.assets && data.assets.length > 0)
                ? data.assets
                : (inferredCashFromGoals > 0
                    ? [{
                        type: 'CASH' as const,
                        name: 'Наличные',
                        current_value: inferredCashFromGoals,
                        currency: 'RUB'
                    }]
                    : []);

            // Calculate Total Liquid Capital from normalized assets
            const assetsInitial = normalizedAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
            const cashInitial = (data.assets || [])
                .filter((a) => a.type === 'CASH')
                .reduce((sum, a) => sum + (a.current_value || 0), 0);
            const effectiveCashInitial = cashInitial > 0
                ? cashInitial
                : normalizedAssets
                    .filter((a) => a.type === 'CASH')
                    .reduce((sum, a) => sum + (a.current_value || 0), 0);

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

            // Life Insurance (ID 5)
            if (data.lifeInsuranceLimit && data.lifeInsuranceLimit > 0) {
                goalsToProcess.push({
                    goal_type_id: 5,
                    name: 'Защита Жизни',
                    target_amount: data.lifeInsuranceLimit,
                    // Default values for Life Insurance request
                    term_months: 180, // 15 years default
                    risk_profile: 'CONSERVATIVE',
                    inflation_rate: 0 // Usually 0 for insurance sum? Or 10? API default is likely handled.
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
                const initialCapital = isRent
                    ? (g.initial_capital || effectiveCashInitial)
                    : isFinReserve
                        ? (g.initial_capital || 0)
                        : isInvestment
                            ? (g.initial_capital || 0)
                            : undefined; // Для RENT берем CASH, для INVEST берем из цели

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
                    payload.target_amount = isRent ? (g.initial_capital || effectiveCashInitial) : (isFinReserve ? (g.initial_capital || 0) : (g.insurance_limit || g.target_amount || 0));
                    payload.term_months = isRent ? 12 : (isFinReserve ? 12 : (g.term_months || 120));
                    if (isInvestment) {
                        // Для INVESTMENT initial_capital берем из цели
                        payload.initial_capital = g.initial_capital || 0;
                    }
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

            const requiredAnswers = ['q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'] as const;
            const hasAllRiskAnswers = requiredAnswers.every((key) => typeof data.riskProfileAnswers[key] === 'number');
            if (!hasAllRiskAnswers) {
                alert('Заполни риск-профиль полностью (вопросы q2-q10).');
                return;
            }

            const familyProfilePayload = {
                ...data.familyProfile,
                spouse: (data.familyProfile.spouse &&
                    (data.familyProfile.spouse.employment_status || data.familyProfile.spouse.monthly_income !== undefined))
                    ? {
                        employment_status: data.familyProfile.spouse.employment_status,
                        monthly_income: data.familyProfile.spouse.monthly_income ?? null
                    }
                    : undefined,
                confidentiality: {
                    allow_spouse_access: Boolean(data.familyProfile.confidentiality.allow_spouse_access),
                    allow_family_contact: Boolean(data.familyProfile.confidentiality.allow_family_contact),
                    notes: data.familyProfile.confidentiality.notes || undefined
                }
            };

            const clientPayload: Record<string, any> = {
                birth_date: data.birthDate || new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
                gender: data.gender,
                avg_monthly_income: data.avgMonthlyIncome,
                total_liquid_capital: assetsInitial,
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                phone: data.phone,
                external_uuid: data.uuid
            };

            if (!clientId) {
                clientPayload.family_profile = familyProfilePayload;
                clientPayload.risk_profile_answers = data.riskProfileAnswers;
            }

            const payload = {
                goals: goalsPayload,
                client: clientPayload,
                // Pass existing assets if needed, or if the API requires full replacement
                assets: normalizedAssets.map(a => ({
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
        { title: 'Семья', icon: <Users size={20} /> },
        { title: 'Цели', icon: <Target size={20} /> },
        { title: 'Активы', icon: <Briefcase size={20} /> },
        { title: 'Финрезерв', icon: <PiggyBank size={20} /> },
        { title: 'Защита Жизни', icon: <Heart size={20} /> },
        { title: 'Риск-профиль', icon: <ShieldCheck size={20} /> }
    ];

    const skipLifeInsurance = shouldSkipLifeInsuranceStep();
    const stepsForHeader = skipLifeInsurance ? steps.filter((_, i) => i !== 5) : steps;

    useEffect(() => {
        // If editing, fetch client data
        if (clientId) {
            // Need to fetch client details and pre-fill `data`
            // Ideally should be done in a useEffect with async call
            // Using a self-executing function or just simpler here
            const loadClient = async () => {
                try {
                    const client = await clientApi.getClient(clientId, { include_chat_ai: false });
                    // Map API client to CJMData
                    setData(prev => ({
                        ...prev,
                        gender: client.gender || 'male',
                        age: client.birth_date ? new Date().getFullYear() - new Date(client.birth_date).getFullYear() : 35,
                        birthDate: client.birth_date || undefined,
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

    // Unified wide layout for all onboarding steps
    const containerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px'
    };

    return (
        <div style={{
            ...containerStyle,
            background: 'linear-gradient(180deg, rgba(19,25,39,0.95) 0%, rgba(14,17,27,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            boxShadow: '0 24px 60px rgba(0,0,0,0.24)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                {onBack && (
                    <div
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            left: '40px',
                            top: '40px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}
                    >
                        ← Назад
                    </div>
                )}
                {stepsForHeader.map((s, i) => {
                    const actualStep = skipLifeInsurance ? (i < 5 ? i + 1 : 7) : i + 1;
                    return (
                    <div key={actualStep} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: step > actualStep ? 'var(--secondary)' : step === actualStep ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: step === actualStep ? '#000' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '12px', color: step === actualStep ? 'var(--primary)' : 'var(--text-muted)' }}>{s.title}</span>
                        {i < stepsForHeader.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: 'calc(50% + 25px)',
                                right: 'calc(-50% + 25px)',
                                height: '2px',
                                background: step > actualStep ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'
                            }} />
                        )}
                    </div>
                    );
                })}
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
                    {step === 2 && <StepFamilyProfile data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 3 && <StepGoalSelection data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 4 && <StepAssets data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 5 && <StepFinReserve data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 6 && <StepLifeInsurance data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
                    {step === 7 && <StepRiskProfile data={data} setData={setData} onComplete={handleCalculate} onPrev={prevStep} loading={loading} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CJMFlow;
