import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, ShieldCheck, Briefcase, PiggyBank, Heart, Users } from 'lucide-react';
import StepClientData from './steps/StepClientData';
import StepFamilyProfile from './steps/StepFamilyProfile';
import StepGoalSelection from './steps/StepGoalSelection';
import StepAssets from './steps/StepAssets';
import StepFinReserve from './steps/StepFinReserve';
import StepLifeInsurance from './steps/StepLifeInsurance';
import StepRiskProfile from './steps/StepRiskProfile';
import B2cCjmShell, { type B2cCjmShellStep } from './b2c/B2cCjmShell';
import { clientApi, type RiskAnswersResponse } from '../api/clientApi';
import { b2cApi, parseGuestCalculateLead } from '../api/b2cApi';
import { getClientB2cAttribution } from '../utils/clientB2cAttribution';
import { buildGuestCalculatePayload, type GuestCalculatePayload } from '../utils/b2cGuestCalculatePayload';
import { extendedToLegacy } from '../constants/portfolioRiskProfiles';
import type { Asset, ClientGoal } from '../types/client';
import type { RiskQuestionnaire } from '../api/clientApi';

export interface CJMCompleteContext {
    firstRunPayload?: GuestCalculatePayload;
    guestLead?: {
        guest_token: string;
        client_id: number;
        plan_saved: boolean;
        email?: string;
    };
}

export interface CJMFlowOrchestratorConfig {
    page: string;
    controlledStep?: number;
    liveCoachMessage?: string;
    onPageSubmit: (page: string, pageData: Record<string, unknown>) => void;
    onGoalSelected?: (payload: { goal_type_id: number; goal_name: string; page: string }) => void;
}

interface CJMFlowProps {
    onComplete: (result: any, context?: CJMCompleteContext) => void;
    initialData?: {
        fio?: string;
        phone?: string;
        email?: string;
        uuid?: string;
    };
    clientId?: number;
    onBack?: () => void;
    /** guest — B2C без логина: calculate + guest risk API */
    mode?: 'agent' | 'guest';
    projectKey?: string;
    inviterName?: string;
    /** B2C plan orchestrator: UI events вместо линейного step++ */
    orchestrator?: CJMFlowOrchestratorConfig;
    /** Скрыть левый sidebar CJM — чат оркестратора слева */
    hideGuestSidebar?: boolean;
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
    email?: string;
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
        credits: ClientCreditDraft[];
        confidentiality: { allow_spouse_access: boolean; allow_family_contact: boolean; notes?: string };
    };
    riskProfileAnswers: Record<string, string>;
    riskQuestionnaireVersionId?: number;
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
export type ClientCreditType = 'MORTGAGE' | 'CONSUMER_LOAN' | 'CREDIT_CARD' | 'AUTO_LOAN' | 'OTHER';

export interface ClientCreditDraft {
    type: ClientCreditType;
    balance: number;
    monthlyPayment: number;
    rate: number;
}

/** Тот же пул, что в StepLifeInsurance / StepFinReserve. */
function clientPoolCapitalForLifeStep(d: CJMData): number {
    const assetsCapital = (d.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);
    const investmentOrRentGoalCapital = (d.goals || [])
        .filter((g) => g.goal_type_id === 3 || g.goal_type_id === 8)
        .reduce((sum, g) => sum + (g.initial_capital || 0), 0);
    return assetsCapital > 0 ? assetsCapital : investmentOrRentGoalCapital;
}

const CAPITAL_FLOOR_LIFE_INSURANCE = 500_000;

const CJMFlow: React.FC<CJMFlowProps> = ({
    onComplete,
    initialData,
    clientId,
    onBack,
    mode = 'agent',
    projectKey: projectKeyProp,
    inviterName,
    orchestrator,
    hideGuestSidebar = false,
}) => {
    const isGuestMode = mode === 'guest';
    const guestAttribution = getClientB2cAttribution();
    const guestProjectKey = projectKeyProp || guestAttribution.project_key;
    const guestRef = guestAttribution.ref?.trim();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [riskQuestionnaire, setRiskQuestionnaire] = useState<RiskQuestionnaire | null>(null);
    const [riskQuestionnaireLoading, setRiskQuestionnaireLoading] = useState(false);
    const [riskQuestionnaireError, setRiskQuestionnaireError] = useState<string | null>(null);
    const riskQuestionnaireRetriedOnStep7 = React.useRef(false);
    const [data, setData] = useState<CJMData>({
        gender: 'male',
        age: 39,
        goalTypeId: 3,
        goalName: 'Инвестиции',
        targetAmount: 1500000,
        termMonths: 60,
        monthlyReplenishment: undefined,
        avgMonthlyIncome: 150000,
        riskProfile: 'BALANCED',
        familyProfile: {
            marital_status: 'married',
            children: [],
            contacts: [],
            spouse: {},
            family_obligations: [{ type: 'loans', amount_monthly: 0 }],
            real_estate: [],
            credits: [],
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

    const buildPageDataForStep = (currentStep: number): Record<string, unknown> => {
        switch (currentStep) {
            case 1:
                return {
                    age: data.age,
                    gender: data.gender,
                    birth_date: data.birthDate,
                    email: data.email,
                    phone: data.phone,
                    family_profile: data.familyProfile,
                    avg_monthly_income: data.avgMonthlyIncome,
                };
            case 3:
                return { goals: data.goals };
            case 4:
                return { assets: data.assets };
            case 5:
                return {
                    initial_capital: data.initialCapital,
                    monthly_replenishment: data.monthlyReplenishment,
                };
            case 6:
                return { life_insurance_limit: data.lifeInsuranceLimit };
            case 7:
                return { risk_profile_answers: data.riskProfileAnswers };
            default:
                return { step: currentStep };
        }
    };

    const advanceStep = () => {
        if (orchestrator) {
            if (orchestrator.controlledStep === 3 || step === 3) {
                const primary = data.goals?.[0];
                if (primary && orchestrator.onGoalSelected) {
                    orchestrator.onGoalSelected({
                        goal_type_id: primary.goal_type_id,
                        goal_name: primary.name,
                        page: orchestrator.page,
                    });
                    return;
                }
            }
            orchestrator.onPageSubmit(orchestrator.page, buildPageDataForStep(step));
            return;
        }
        setStep((s) => {
            if (isGuestMode && s === 1) return 3;
            if (s === 3 && shouldSkipAssetsStep()) return 5;
            if (s === 5 && shouldSkipLifeInsuranceStep()) return 7;
            return s + 1;
        });
    };

    const nextStep = () => {
        advanceStep();
    };
    const prevStep = () => {
        setStep((s) => {
            if (isGuestMode && s === 3) return 1;
            if (s === 5 && shouldSkipAssetsStep()) return 3;
            if (s === 7 && shouldSkipLifeInsuranceStep()) return 5;
            return s - 1;
        });
    };

    useLayoutEffect(() => {
        if (orchestrator?.controlledStep && orchestrator.controlledStep !== step) {
            setStep(orchestrator.controlledStep);
        }
    }, [orchestrator?.controlledStep, orchestrator, step]);

    useLayoutEffect(() => {
        if (step === 6 && clientPoolCapitalForLifeStep(data) < CAPITAL_FLOOR_LIFE_INSURANCE) {
            setStep(7);
        }
    }, [step, data]);

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [step]);

    const handleCalculate = async () => {
        setLoading(true);
        if (orchestrator) {
            orchestrator.onPageSubmit(orchestrator.page, buildPageDataForStep(7));
        }
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
                    term_months: 60, // 5 years default
                    risk_profile: 'CONSERVATIVE',
                    inflation_rate: 0 // Usually 0 for insurance sum? Or 10? API default is likely handled.
                });
            }

            const questionnaireQuestions = riskQuestionnaire?.questions || [];
            const normalizedRiskAnswers = questionnaireQuestions.reduce<Record<string, string>>((acc, question) => {
                const selectedOptionCode = data.riskProfileAnswers[question.code];
                if (typeof selectedOptionCode !== 'string') {
                    return acc;
                }
                const optionExists = (question.options || []).some((option) => option.code === selectedOptionCode);
                if (optionExists) {
                    acc[question.code] = selectedOptionCode;
                }
                return acc;
            }, {});
            const hasAllRiskAnswers =
                questionnaireQuestions.length > 0 &&
                questionnaireQuestions.every((question) => typeof normalizedRiskAnswers[question.code] === 'string');
            if (!hasAllRiskAnswers) {
                alert('Заполни риск-профиль полностью.');
                return;
            }

            const questionnaireVersionIdForRisk = data.riskQuestionnaireVersionId ?? riskQuestionnaire?.id;
            let preSavedRiskResponse: RiskAnswersResponse | null = null;
            if (isGuestMode && questionnaireVersionIdForRisk) {
                try {
                    const primaryGoal = goalsToProcess[0];
                    preSavedRiskResponse = await b2cApi.evaluateGuestRisk(guestProjectKey, {
                        risk_profile_answers: normalizedRiskAnswers,
                        goal: primaryGoal
                            ? {
                                  goal_type_id: primaryGoal.goal_type_id,
                                  term_months: primaryGoal.term_months,
                              }
                            : undefined,
                        client: {
                            birth_date:
                                data.birthDate ||
                                new Date(new Date().getFullYear() - data.age, 0, 1)
                                    .toISOString()
                                    .split('T')[0],
                            gender: data.gender,
                        },
                    });
                    const nextRiskProfile = preSavedRiskResponse.risk_profile_result?.risk_profile;
                    if (nextRiskProfile && typeof nextRiskProfile === 'string') {
                        setData((prev) => ({
                            ...prev,
                            riskProfile: nextRiskProfile as CJMData['riskProfile'],
                        }));
                    }
                } catch (e) {
                    console.error('Failed to evaluate guest risk profile:', e);
                    alert('Не удалось рассчитать риск-профиль. Попробуйте ещё раз.');
                    return;
                }
            } else if (clientId && questionnaireVersionIdForRisk) {
                try {
                    preSavedRiskResponse = await clientApi.saveRiskAnswers(
                        {
                            risk_profile_answers: normalizedRiskAnswers,
                            risk_questionnaire_version_id: questionnaireVersionIdForRisk,
                        },
                        clientId,
                    );
                    const nextRiskProfile = preSavedRiskResponse.risk_profile_result?.risk_profile;
                    if (nextRiskProfile && typeof nextRiskProfile === 'string') {
                        setData((prev) => ({
                            ...prev,
                            riskProfile: nextRiskProfile as CJMData['riskProfile'],
                        }));
                    }
                } catch (e) {
                    console.error('Failed to pre-save risk profile answers:', e);
                }
            }

            const questionnaireExtended =
                typeof preSavedRiskResponse?.risk_profile_result?.risk_profile_extended === 'string'
                    ? preSavedRiskResponse.risk_profile_result.risk_profile_extended
                    : null;

            const goalsPayload = goalsToProcess.map(g => {
                // Определяем типы целей сначала
                const isRent = g.goal_type_id === 8;
                const isFinReserve = g.goal_type_id === 7;
                const isInvestment = g.goal_type_id === 3;
                const isInheritance = g.goal_type_id === 11; // INHERITANCE
                const isPension = g.goal_type_id === 1; // PENSION
                const isPassiveIncome = g.goal_type_id === 2; // PASSIVE_INCOME

                // Only for FIN_RESERVE (id=7) and RENT (id=8), use initial_capital from goal itself
                // For other goals, бэк сам распределит из активов - не передаем initial_capital
                const initialCapital = isRent
                    ? (g.initial_capital || effectiveCashInitial)
                    : isFinReserve
                        ? (g.initial_capital || 0)
                        : isInvestment || isInheritance
                            ? (g.initial_capital || 0)
                            : undefined; // Для RENT берем CASH, для INVEST/INHERITANCE — из цели

                // monthly_replenishment передаем только для Investment (id=3) и FIN_RESERVE (id=7)
                // Для остальных целей (PASSIVE_INCOME, PENSION, RENT и др.) не передаем
                const monthlyReplenishment = (isFinReserve || isInvestment)
                    ? (g.monthly_replenishment !== undefined ? g.monthly_replenishment : (data.monthlyReplenishment || undefined))
                    : undefined;

                const goalExt = typeof g.risk_profile_extended === 'string' ? g.risk_profile_extended : null;
                const payload: any = {
                    goal_type_id: g.goal_type_id,
                    name: g.name,
                    inflation_rate: g.inflation_rate || 10,
                };
                if (questionnaireExtended) {
                    payload.risk_profile_extended = questionnaireExtended;
                    payload.risk_profile = extendedToLegacy(questionnaireExtended);
                } else if (goalExt) {
                    payload.risk_profile_extended = goalExt;
                    payload.risk_profile = extendedToLegacy(goalExt);
                } else {
                    payload.risk_profile = (g.risk_profile || data.riskProfile || 'BALANCED') as
                        | 'CONSERVATIVE'
                        | 'BALANCED'
                        | 'AGGRESSIVE';
                }

                // Для PENSION и PASSIVE_INCOME: target_amount = desired_monthly_income, term_months не нужен
                if (isPension || isPassiveIncome) {
                    payload.target_amount = g.desired_monthly_income || 0;
                    payload.term_months = g.term_months || 120; // Все равно нужен для API, но бэк может игнорировать
                    if (g.desired_monthly_income !== undefined) {
                        payload.desired_monthly_income = g.desired_monthly_income;
                    }
                } else {
                    // Для остальных целей
                    payload.target_amount = isInheritance
                        ? 0
                        : isRent
                            ? (g.initial_capital || effectiveCashInitial)
                            : isFinReserve
                                ? (g.initial_capital || 0)
                                : (g.insurance_limit || g.target_amount || 0);
                    payload.term_months = isRent ? 12 : (isFinReserve ? 12 : (g.term_months || 120));
                    if (isInvestment || isInheritance) {
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

            const normalizedCredits = (data.familyProfile.credits || [])
                .filter((credit) => {
                    const hasBalance = Number(credit.balance) > 0;
                    const hasMonthlyPayment = Number(credit.monthlyPayment) > 0;
                    return hasBalance || hasMonthlyPayment;
                })
                .map((credit) => ({
                    type: credit.type,
                    balance: Number(credit.balance) || 0,
                    monthlyPayment: Number(credit.monthlyPayment) || 0,
                    rate: Number(credit.rate) || 0
                }));

            const creditTypeToName: Record<ClientCreditType, string> = {
                MORTGAGE: 'Ипотека',
                CONSUMER_LOAN: 'Потребительский кредит',
                CREDIT_CARD: 'Кредитная карта',
                AUTO_LOAN: 'Автокредит',
                OTHER: 'Кредит'
            };

            const mappedLiabilities = normalizedCredits.map((credit) => ({
                type: credit.type,
                name: creditTypeToName[credit.type] || 'Кредит',
                remaining_amount: credit.balance,
                monthly_payment: credit.monthlyPayment,
                interest_rate: credit.rate
            }));

            const emailTrimmed = (data.email || '').trim();
            const questionnaireVersionId =
                data.riskQuestionnaireVersionId ??
                riskQuestionnaire?.id;
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
            if (emailTrimmed) {
                clientPayload.email = emailTrimmed;
            }
            if (questionnaireVersionId) {
                clientPayload.risk_profile_answers = normalizedRiskAnswers;
                clientPayload.risk_questionnaire_version_id = questionnaireVersionId;
            }

            if (!clientId) {
                clientPayload.family_profile = familyProfilePayload;
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
                credits: normalizedCredits,
                liabilities: mappedLiabilities,
                expenses: []
            };

            let response;
            let guestPayload: ReturnType<typeof buildGuestCalculatePayload> | null = null;
            let latestRiskResponse: {
                risk_profile_answers: Record<string, string>;
                risk_questionnaire_version_id: number;
                risk_profile_result?: unknown;
                risk_profile_explanation?: unknown;
            } | null = null;
            if (isGuestMode) {
                guestPayload = buildGuestCalculatePayload({
                    ref: guestRef,
                    goals: goalsPayload,
                    birthDate:
                        data.birthDate ||
                        new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
                    gender: data.gender,
                    fio: data.fio,
                    firstName,
                    lastName,
                    middleName,
                    phone: data.phone,
                    email: emailTrimmed || undefined,
                    avgMonthlyIncome: data.avgMonthlyIncome,
                    assets: normalizedAssets,
                    totalLiquidCapital: assetsInitial,
                    riskProfileAnswers: questionnaireVersionId ? normalizedRiskAnswers : undefined,
                    riskQuestionnaireVersionId: questionnaireVersionId,
                    familyProfile: data.familyProfile as unknown as Record<string, unknown>,
                });
                response = await b2cApi.guestCalculate(guestProjectKey, guestPayload);
            } else if (clientId) {
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

            if (questionnaireVersionId && !isGuestMode) {
                try {
                    if (preSavedRiskResponse) {
                        latestRiskResponse = preSavedRiskResponse;
                    } else {
                        const riskSaveResponse = await clientApi.saveRiskAnswers(
                            {
                                risk_profile_answers: normalizedRiskAnswers,
                                risk_questionnaire_version_id: questionnaireVersionId,
                            },
                            clientId ||
                                Number(response?.client_id) ||
                                Number(response?.id) ||
                                Number(response?.summary?.client_id),
                        );
                        latestRiskResponse = riskSaveResponse;
                        const nextRiskProfile = riskSaveResponse.risk_profile_result?.risk_profile;
                        if (nextRiskProfile && typeof nextRiskProfile === 'string') {
                            setData((prev) => ({
                                ...prev,
                                riskProfile: nextRiskProfile as CJMData['riskProfile'],
                            }));
                        }
                    }
                } catch (riskSaveError) {
                    console.error('Failed to save risk profile answers:', riskSaveError);
                }
            }

            const guestRiskResponse = isGuestMode ? preSavedRiskResponse : null;
            const responseWithRiskData = latestRiskResponse || guestRiskResponse
                ? {
                    ...response,
                    risk_profile_answers:
                        (latestRiskResponse || guestRiskResponse)?.risk_profile_answers ??
                        normalizedRiskAnswers,
                    risk_questionnaire_version_id:
                        (latestRiskResponse || guestRiskResponse)?.risk_questionnaire_version_id ??
                        questionnaireVersionId,
                    risk_profile_result:
                        (latestRiskResponse || guestRiskResponse)?.risk_profile_result || null,
                    risk_profile_explanation:
                        (latestRiskResponse || guestRiskResponse)?.risk_profile_explanation || null,
                }
                : response;
            const guestLead =
                isGuestMode && guestPayload
                    ? parseGuestCalculateLead(responseWithRiskData, emailTrimmed || undefined)
                    : null;
            onComplete(
                responseWithRiskData,
                guestPayload
                    ? {
                          firstRunPayload: guestPayload,
                          guestLead: guestLead ?? undefined,
                      }
                    : undefined,
            );
        } catch (error) {
            console.error('Calculation error:', error);
            alert('Ошибка при расчете. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    const stepDefinitions: B2cCjmShellStep[] = [
        { title: 'Личные данные', icon: User, stepNumber: 1 },
        { title: 'Семья', icon: Users, stepNumber: 2 },
        { title: 'Цели', icon: Target, stepNumber: 3 },
        { title: 'Активы', icon: Briefcase, stepNumber: 4 },
        { title: 'Финрезерв', icon: PiggyBank, stepNumber: 5 },
        { title: 'Защита Жизни', icon: Heart, stepNumber: 6 },
        { title: 'Риск-профиль', icon: ShieldCheck, stepNumber: 7 },
    ];

    const steps = stepDefinitions.map(({ title, icon, stepNumber }) => ({
        title,
        icon: <>{React.createElement(icon, { size: 20 })}</>,
        stepNumber,
    }));

    const skipLifeInsurance = shouldSkipLifeInsuranceStep();
    const stepsForHeader = skipLifeInsurance ? steps.filter((s) => s.stepNumber !== 6) : steps;
    const b2cShellSteps = skipLifeInsurance
        ? stepDefinitions.filter((s) => s.stepNumber !== 6)
        : stepDefinitions;

    const loadRiskQuestionnaire = useCallback(async () => {
        setRiskQuestionnaireLoading(true);
        setRiskQuestionnaireError(null);
        try {
            const questionnaire = isGuestMode
                ? await b2cApi.getGuestRiskQuestionnaire(guestProjectKey)
                : await clientApi.getRiskQuestionnaireV2();
            if (!Array.isArray(questionnaire?.questions) || questionnaire.questions.length === 0) {
                throw new Error('Сервер вернул пустую анкету риск-профиля');
            }
            setRiskQuestionnaire(questionnaire);
            setData((prev) => ({
                ...prev,
                riskQuestionnaireVersionId: questionnaire.id,
            }));
        } catch (e) {
            console.error('Failed to load risk questionnaire', e);
            setRiskQuestionnaire(null);
            setRiskQuestionnaireError(
                e instanceof Error && e.message
                    ? e.message
                    : 'Не удалось загрузить анкету риск-профиля',
            );
        } finally {
            setRiskQuestionnaireLoading(false);
        }
    }, [isGuestMode, guestProjectKey]);

    useEffect(() => {
        void loadRiskQuestionnaire();
    }, [loadRiskQuestionnaire]);

    useEffect(() => {
        if (step !== 7) {
            riskQuestionnaireRetriedOnStep7.current = false;
            return;
        }
        if (riskQuestionnaireRetriedOnStep7.current) return;
        if (riskQuestionnaireLoading) return;
        if ((riskQuestionnaire?.questions?.length ?? 0) > 0) return;
        riskQuestionnaireRetriedOnStep7.current = true;
        void loadRiskQuestionnaire();
    }, [step, riskQuestionnaireLoading, riskQuestionnaire?.questions?.length, loadRiskQuestionnaire]);

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
                        email: client.email,
                        uuid: client.external_uuid,
                        avgMonthlyIncome: client.avg_monthly_income || 150000,
                        riskProfileAnswers: client.risk_profile_answers || prev.riskProfileAnswers,
                        familyProfile: {
                            ...prev.familyProfile,
                            ...(client.family_profile || {}),
                            credits: ((client as any).credits || (client as any).liabilities || []).map((credit: any) => ({
                                type: (credit.type || 'OTHER') as ClientCreditType,
                                balance: Number(credit.balance ?? credit.remaining_amount) || 0,
                                monthlyPayment: Number(credit.monthlyPayment ?? credit.monthly_payment) || 0,
                                rate: Number(credit.rate ?? credit.interest_rate) || 0
                            }))
                        },
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

    const renderStepContent = () => (
        <>
            {step === 1 && (
                isGuestMode ? (
                    <StepFamilyProfile
                        data={data}
                        setData={setData}
                        onNext={nextStep}
                        onPrev={prevStep}
                        hideNda
                        variant="b2c"
                        showBack={false}
                    />
                ) : (
                    <StepClientData
                        data={data}
                        setData={setData}
                        onNext={nextStep}
                        emailOnly={isGuestMode}
                        variant={isGuestMode ? 'b2c' : 'default'}
                    />
                )
            )}
            {step === 2 && !isGuestMode && (
                <StepFamilyProfile
                    data={data}
                    setData={setData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    hideNda={isGuestMode}
                    variant="default"
                />
            )}
            {step === 3 && (
                <StepGoalSelection
                    data={data}
                    setData={setData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    guestMode={isGuestMode}
                />
            )}
            {step === 4 && (
                <StepAssets
                    data={data}
                    setData={setData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    guestMode={isGuestMode}
                />
            )}
            {step === 5 && (
                <StepFinReserve
                    data={data}
                    setData={setData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    guestMode={isGuestMode}
                />
            )}
            {step === 6 && (
                <StepLifeInsurance
                    data={data}
                    setData={setData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    guestMode={isGuestMode}
                />
            )}
            {step === 7 && (
                <StepRiskProfile
                    data={data}
                    setData={setData}
                    onComplete={handleCalculate}
                    onPrev={prevStep}
                    loading={loading}
                    questionnaire={riskQuestionnaire}
                    isQuestionnaireLoading={riskQuestionnaireLoading}
                    questionnaireLoadError={riskQuestionnaireError}
                    onRetryQuestionnaire={() => void loadRiskQuestionnaire()}
                    guestMode={isGuestMode}
                />
            )}
        </>
    );

    const stepMotion = (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={isGuestMode ? 'b2c-cjm-step' : 'premium-card'}
            >
                {renderStepContent()}
            </motion.div>
        </AnimatePresence>
    );

    if (isGuestMode) {
        return (
            <B2cCjmShell
                currentStep={step}
                steps={b2cShellSteps}
                inviterName={inviterName}
                clientAge={data.age}
                hideSidebar={hideGuestSidebar}
                liveCoachMessage={orchestrator?.liveCoachMessage}
                mainVariant={
                    step === 3
                        ? 'goals'
                        : step === 4
                          ? 'assets'
                          : step === 5
                            ? 'reserve'
                            : step === 6
                              ? 'life'
                              : step === 7
                                ? 'risk'
                                : 'form'
                }
            >
                {stepMotion}
            </B2cCjmShell>
        );
    }

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
                {stepsForHeader.map((s, i) => (
                    <div key={s.stepNumber} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: step > s.stepNumber ? 'var(--secondary)' : step === s.stepNumber ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: step === s.stepNumber ? '#000' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '12px', color: step === s.stepNumber ? 'var(--primary)' : 'var(--text-muted)' }}>{s.title}</span>
                        {i < stepsForHeader.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: 'calc(50% + 25px)',
                                right: 'calc(-50% + 25px)',
                                height: '2px',
                                background: step > s.stepNumber ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'
                            }} />
                        )}
                    </div>
                ))}
            </div>

            {stepMotion}
        </div>
    );
};

export default CJMFlow;
