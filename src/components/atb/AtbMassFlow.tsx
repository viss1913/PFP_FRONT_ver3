import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, User } from 'lucide-react';
import { clientApi } from '../../api/clientApi';
import type { CJMData } from '../CJMFlow';
import type { ClientGoal } from '../../types/client';
import AtbMassGoalCard from './AtbMassGoalCard';
import AtbMassGoalEditModal from './AtbMassGoalEditModal';
import {
    buildAtbMassGoalPlan,
    normalizeAtbMassTermMonths,
    type AtbMassGoalOverrides,
    type AtbMassIntakeValues,
} from '../../utils/atbMassGoals';
import { rangeFillStyle } from '../../utils/rangeInputStyle';
import { getGoalImage, GOAL_TYPE_FIN_RESERVE, GOAL_TYPE_INHERITANCE, GOAL_TYPE_INVESTMENT, GOAL_TYPE_PENSION } from '../../utils/GoalImages';
import reserveImage from '../../assets/goals/reserve.webp';
import lifeInsuranceImage from '../../assets/goals/lifeinsurance.webp';

interface AtbMassFlowProps {
    onComplete: (result: any) => void | Promise<void>;
}

type AtbMassData = CJMData & {
    currentCapital: number;
    desiredMonthlyContribution: number;
};

const STEP_TITLES = ['Анкета', 'Параметры', 'Цели'] as const;
const TERM_MONTHS_MIN = 6;
const TERM_MONTHS_MAX = 360;
const TERM_MONTHS_STEP = 6;

function formatTermMonthsLabel(months: number): string {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (years > 0 && rest > 0) return `${months} мес. · ${years} г. ${rest} мес.`;
    if (years > 0) return `${months} мес. · ${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    return `${months} мес.`;
}

function buildDefaultFamilyProfile(): CJMData['familyProfile'] {
    return {
        marital_status: '',
        children: [],
        contacts: [],
        spouse: {},
        family_obligations: [],
        real_estate: [],
        credits: [],
        confidentiality: {
            allow_spouse_access: false,
            allow_family_contact: false,
            notes: '',
        },
    };
}

function splitFio(fullName: string): { firstName: string; lastName: string; middleName: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
        return {
            lastName: parts[0],
            firstName: parts[1],
            middleName: parts.slice(2).join(' '),
        };
    }
    if (parts.length === 2) {
        return {
            lastName: parts[0],
            firstName: parts[1],
            middleName: '',
        };
    }
    return {
        firstName: parts[0] || 'Клиент',
        lastName: 'ATB',
        middleName: '',
    };
}

function formatBirthDateFromAge(age: number): string {
    const today = new Date();
    const year = today.getFullYear() - Math.max(18, Math.round(age));
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** firstRun для ATB mass: капитал клиента в client.total_liquid_capital, initial_capital только у финрезерва. */
function buildAtbMassFirstRunGoalPayload(
    goals: ClientGoal[],
    riskProfile: CJMData['riskProfile'],
    intake: AtbMassIntakeValues,
) {
    return goals.map((goal) => {
        const base: Record<string, unknown> = {
            goal_type_id: goal.goal_type_id,
            name: goal.name,
            inflation_rate: goal.inflation_rate ?? 5.6,
            risk_profile: goal.risk_profile || riskProfile || 'BALANCED',
        };

        if (goal.goal_type_id === 1) {
            const payload: Record<string, unknown> = {
                ...base,
                desired_monthly_income: goal.desired_monthly_income || 0,
                target_amount: goal.desired_monthly_income || goal.target_amount || 0,
                term_months: goal.term_months || 60,
            };
            if (goal.monthly_replenishment != null && goal.monthly_replenishment > 0) {
                payload.monthly_replenishment = Math.round(goal.monthly_replenishment);
            }
            return payload;
        }

        if (goal.goal_type_id === 5) {
            return {
                ...base,
                target_amount: goal.target_amount || 0,
                term_months: goal.term_months || 60,
                payment_variant: 12,
                program: 'test',
            };
        }

        if (goal.goal_type_id === 7) {
            const reserveCapital = Math.max(0, Math.round(goal.initial_capital || 0));
            return {
                ...base,
                initial_capital: reserveCapital,
                monthly_replenishment: Math.max(0, Math.round(goal.monthly_replenishment || 0)),
                target_amount: reserveCapital,
                term_months: 12,
            };
        }

        if (goal.goal_type_id === 3) {
            return {
                ...base,
                monthly_replenishment: Math.max(0, Math.round(intake.desiredMonthlyContribution || 0)),
                target_amount: 0,
                term_months: normalizeAtbMassTermMonths(intake.termMonths || goal.term_months || 60),
            };
        }

        if (goal.goal_type_id === 11) {
            return {
                ...base,
                target_amount: 0,
                term_months: goal.term_months || 120,
            };
        }

        return {
            ...base,
            target_amount: goal.target_amount || 0,
            term_months: goal.term_months || 120,
        };
    });
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

function formatInputNumber(value: number): string {
    if (!Number.isFinite(value)) return '';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value));
}

function parseInputNumber(raw: string): number {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return 0;
    return Number(digits);
}

function clampNumber(value: number, min: number, max?: number): number {
    let next = Math.max(min, Math.round(value || 0));
    if (max !== undefined) {
        next = Math.min(max, next);
    }
    return next;
}

function NumericField({
    label,
    value,
    onChange,
    min = 0,
    max,
    suffix,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    suffix?: string;
}) {
    const handleChange = (raw: string) => {
        const parsed = parseInputNumber(raw);
        onChange(clampNumber(parsed, min, max));
    };

    return (
        <label style={{ display: 'block' }}>
            <div className="label" style={{ marginBottom: 8 }}>{label}</div>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputNumber(value)}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="0"
                    style={{ paddingRight: suffix ? 72 : undefined }}
                />
                {suffix ? (
                    <span
                        style={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        {suffix}
                    </span>
                ) : null}
            </div>
        </label>
    );
}

function GenderToggle({
    value,
    onChange,
}: {
    value: CJMData['gender'];
    onChange: (value: CJMData['gender']) => void;
}) {
    return (
        <div className="atb-gender-toggle" role="group" aria-label="Пол">
            <button
                type="button"
                className={`atb-gender-toggle__btn${value === 'male' ? ' atb-gender-toggle__btn--active' : ''}`}
                onClick={() => onChange('male')}
                aria-pressed={value === 'male'}
            >
                Мужской
            </button>
            <button
                type="button"
                className={`atb-gender-toggle__btn${value === 'female' ? ' atb-gender-toggle__btn--active' : ''}`}
                onClick={() => onChange('female')}
                aria-pressed={value === 'female'}
            >
                Женский
            </button>
        </div>
    );
}

function TermMonthsSlider({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const safeValue = normalizeAtbMassTermMonths(value || TERM_MONTHS_MIN);

    return (
        <div className="atb-term-slider">
            <div className="atb-term-slider__head">
                <span className="label">Срок инвестирования</span>
                <strong className="atb-term-slider__value">{formatTermMonthsLabel(safeValue)}</strong>
            </div>
            <input
                type="range"
                className="goal-modal-range"
                min={TERM_MONTHS_MIN}
                max={TERM_MONTHS_MAX}
                step={TERM_MONTHS_STEP}
                value={safeValue}
                onChange={(event) => onChange(normalizeAtbMassTermMonths(Number(event.target.value)))}
                style={rangeFillStyle(safeValue, TERM_MONTHS_MIN, TERM_MONTHS_MAX)}
                aria-valuemin={TERM_MONTHS_MIN}
                aria-valuemax={TERM_MONTHS_MAX}
                aria-valuenow={safeValue}
            />
            <div className="atb-term-slider__scale">
                <span>{TERM_MONTHS_MIN} мес.</span>
                <span>{TERM_MONTHS_MAX / 12} лет</span>
            </div>
        </div>
    );
}

function getGoalCardImage(goalKey: string, goal: ClientGoal): string {
    if (goalKey === 'fin-reserve') return reserveImage;
    if (goalKey === 'life') return lifeInsuranceImage;
    if (goal.goal_type_id === GOAL_TYPE_INVESTMENT) return getGoalImage(goal.name, goal.goal_type_id);
    if (goal.goal_type_id === GOAL_TYPE_PENSION) return getGoalImage('Достойная пенсия', goal.goal_type_id);
    if (goal.goal_type_id === GOAL_TYPE_INHERITANCE) return getGoalImage(goal.name, goal.goal_type_id);
    return getGoalImage(goal.name, goal.goal_type_id);
}

const AtbMassFlow: React.FC<AtbMassFlowProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [goalOverrides, setGoalOverrides] = useState<AtbMassGoalOverrides>({});
    const [excludedGoalKeys, setExcludedGoalKeys] = useState<string[]>([]);
    const [editingGoalKey, setEditingGoalKey] = useState<string | null>(null);
    const [data, setData] = useState<AtbMassData>(() => ({
        gender: 'male',
        age: 39,
        goalTypeId: 3,
        goalName: 'Сохранить и преумножить',
        targetAmount: 0,
        termMonths: 60,
        monthlyReplenishment: 0,
        avgMonthlyIncome: 0,
        riskProfile: 'BALANCED',
        familyProfile: buildDefaultFamilyProfile(),
        riskProfileAnswers: {},
        currentCapital: 5_000_000,
        desiredMonthlyContribution: 50_000,
        fio: '',
        uuid: crypto.randomUUID(),
    }));

    useEffect(() => {
        setExcludedGoalKeys((prev) =>
            prev.filter((key) => {
                if (key === 'pension' || key === 'life') return data.age < 55;
                if (key === 'inheritance') return data.age >= 55;
                return true;
            }),
        );
    }, [data.age]);

    const goalPlan = useMemo(
        () =>
            buildAtbMassGoalPlan({
                age: data.age,
                currentCapital: data.currentCapital,
                desiredMonthlyContribution: data.desiredMonthlyContribution,
                termMonths: data.termMonths || 60,
            }, goalOverrides, excludedGoalKeys),
        [data.age, data.currentCapital, data.desiredMonthlyContribution, data.termMonths, goalOverrides, excludedGoalKeys],
    );

    const handleRemoveGoal = (key: string) => {
        setExcludedGoalKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
        if (editingGoalKey === key) setEditingGoalKey(null);
    };

    const isPersonalStepValid = (data.fio || '').trim().length > 5 && data.age >= 18 && data.age <= 80;
    const isStrategyStepValid = data.currentCapital >= 0 && data.desiredMonthlyContribution >= 0 && (data.termMonths || 0) >= 6;

    const updateGoalOverride = (patch: Partial<AtbMassGoalOverrides>) => {
        setGoalOverrides((prev) => ({ ...prev, ...patch }));
    };

    const editingGoalItem = useMemo(
        () => goalPlan.previewItems.find((item) => item.key === editingGoalKey) ?? null,
        [editingGoalKey, goalPlan.previewItems],
    );

    const reserveCapitalForModal = goalPlan.goals.find((goal) => goal.goal_type_id === GOAL_TYPE_FIN_RESERVE)?.initial_capital || 0;

    const handleCalculate = async () => {
        if (goalPlan.goals.length === 0) return;
        setLoading(true);
        try {
            const fio = splitFio(data.fio || '');
            const liquidCapital = Math.max(0, Math.round(data.currentCapital || 0));
            const intake: AtbMassIntakeValues = {
                currentCapital: liquidCapital,
                desiredMonthlyContribution: data.desiredMonthlyContribution,
                termMonths: data.termMonths || 60,
            };
            const payload = {
                client: {
                    birth_date: formatBirthDateFromAge(data.age),
                    sex: data.gender,
                    first_name: fio.firstName,
                    total_liquid_capital: liquidCapital,
                    assets:
                        liquidCapital > 0
                            ? [
                                {
                                    type: 'CASH',
                                    name: 'Капитал клиента',
                                    current_value: liquidCapital,
                                    currency: 'RUB',
                                    unlock_month: 0,
                                },
                            ]
                            : [],
                },
                goals: buildAtbMassFirstRunGoalPayload(goalPlan.goals, data.riskProfile, intake),
                credits: [],
                expenses: [],
                liabilities: [],
            };

            const response = await clientApi.firstRun(payload);
            await onComplete(response);
        } catch (error) {
            console.error('ATB mass calculation error:', error);
            alert('Не удалось построить план. Проверь данные и попробуй еще раз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 56px' }}>
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    {STEP_TITLES.map((title, index) => {
                        const active = index + 1 === step;
                        const completed = index + 1 < step;
                        return (
                            <div
                                key={title}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 999,
                                    background: active
                                        ? 'rgba(255, 199, 80, 0.22)'
                                        : completed
                                            ? 'rgba(16, 185, 129, 0.14)'
                                            : 'rgba(148, 163, 184, 0.12)',
                                    color: '#0f172a',
                                    fontWeight: 600,
                                    fontSize: 13,
                                }}
                            >
                                {index + 1}. {title}
                            </div>
                        );
                    })}
                </div>
                <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>ATB mass onboarding</h1>
                <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', maxWidth: 720 }}>
                    Короткий сценарий для быстрой первичной сборки ПФП: минимум полей, явные автоцели и сразу в расчет, без риск-профиля.
                </p>
            </div>

            {step === 1 && (
                <div className="premium-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <User size={22} />
                        <h2 style={{ margin: 0, fontSize: 22 }}>Данные клиента</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
                        <label style={{ display: 'block', gridColumn: '1 / -1' }}>
                            <div className="label" style={{ marginBottom: 8 }}>ФИО</div>
                            <input
                                type="text"
                                value={data.fio || ''}
                                onChange={(e) => setData((prev) => ({ ...prev, fio: e.target.value }))}
                                placeholder="Иванов Иван Иванович"
                            />
                        </label>

                        <div style={{ display: 'block' }}>
                            <div className="label" style={{ marginBottom: 8 }}>Пол</div>
                            <GenderToggle
                                value={data.gender}
                                onChange={(gender) => setData((prev) => ({ ...prev, gender }))}
                            />
                        </div>

                        <NumericField
                            label="Возраст"
                            value={data.age}
                            onChange={(value) => setData((prev) => ({ ...prev, age: Math.max(18, Math.min(80, Math.round(value || 0))) }))}
                            min={18}
                            max={80}
                            suffix="лет"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            В этом flow не грузим доходы, расходы и семейный блок.
                        </div>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!isPersonalStepValid}
                            onClick={() => setStep(2)}
                            style={{ opacity: isPersonalStepValid ? 1 : 0.5 }}
                        >
                            Дальше
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="premium-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Briefcase size={22} />
                        <h2 style={{ margin: 0, fontSize: 22 }}>Капитал и горизонт</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                        <NumericField
                            label="Текущий капитал"
                            value={data.currentCapital}
                            onChange={(value) => setData((prev) => ({ ...prev, currentCapital: Math.max(0, Math.round(value || 0)) }))}
                            min={0}
                            suffix="₽"
                        />

                        <NumericField
                            label="Желаемое пополнение"
                            value={data.desiredMonthlyContribution}
                            onChange={(value) =>
                                setData((prev) => ({ ...prev, desiredMonthlyContribution: Math.max(0, Math.round(value || 0)) }))
                            }
                            min={0}
                            suffix="₽/мес."
                        />
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <TermMonthsSlider
                            value={data.termMonths || 60}
                            onChange={(termMonths) => setData((prev) => ({ ...prev, termMonths }))}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 24,
                            padding: 18,
                            borderRadius: 18,
                            background: 'rgba(15, 23, 42, 0.03)',
                            color: '#334155',
                            fontSize: 14,
                            lineHeight: 1.6,
                        }}
                    >
                        Срок округляется шагом по 6 месяцев. Базовую цель "Сохранить и преумножить" оставляем всегда,
                        возрастные цели добавляем сверху автоматически.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                        <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                            Назад
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!isStrategyStepValid}
                            onClick={() => setStep(3)}
                            style={{ opacity: isStrategyStepValid ? 1 : 0.5 }}
                        >
                            Показать цели
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="premium-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <CheckCircle2 size={22} />
                        <h2 style={{ margin: 0, fontSize: 22 }}>Автоцели для плана</h2>
                    </div>

                    <div
                        style={{
                            marginBottom: 18,
                            padding: 18,
                            borderRadius: 20,
                            background: 'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.92) 100%)',
                            color: '#f8fafc',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 14,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.72, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Зарезервировано
                            </div>
                            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800 }}>
                                {formatMoney(goalPlan.totalAllocatedCapital)} ₽
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.72, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                В базовую цель уходит
                            </div>
                            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800 }}>
                                {formatMoney(data.currentCapital)} ₽
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.72, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Пополнение в базовую цель
                            </div>
                            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800 }}>
                                {formatMoney(data.desiredMonthlyContribution)} ₽/мес.
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 18,
                        }}
                    >
                        {goalPlan.previewItems.map((item) => {
                            const canRemove = Boolean(item.removable && goalPlan.previewItems.length > 1);
                            return (
                                <AtbMassGoalCard
                                    key={item.key}
                                    title={item.title}
                                    imageUrl={getGoalCardImage(item.key, item.goal)}
                                    metrics={item.metrics}
                                    editable={item.editable}
                                    removable={canRemove}
                                    onClick={item.editable ? () => setEditingGoalKey(item.key) : undefined}
                                    onRemove={canRemove ? () => handleRemoveGoal(item.key) : undefined}
                                />
                            );
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 22,
                            padding: 18,
                            borderRadius: 18,
                            background: 'rgba(255, 199, 80, 0.14)',
                            color: '#5b4a11',
                            fontSize: 14,
                            lineHeight: 1.65,
                        }}
                    >
                        {data.age >= 55
                            ? 'Корзина убирает цель из анкеты. Настройки — по клику на карточку. Базовая цель пересчитается сама.'
                            : 'Лишние цели можно убрать корзиной. По клику на карточку — настройки. Базовая инвестиционная цель обновляется автоматически.'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                        <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                            Назад
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => void handleCalculate()}
                            disabled={loading || goalPlan.goals.length === 0}
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Считаем план...' : 'Построить план'}
                        </button>
                    </div>
                </div>
            )}

            <AtbMassGoalEditModal
                item={editingGoalItem}
                currentCapital={data.currentCapital}
                desiredMonthlyContribution={data.desiredMonthlyContribution}
                reserveCapital={reserveCapitalForModal}
                draftOverrides={goalOverrides}
                onClose={() => setEditingGoalKey(null)}
                onApply={(patch) => {
                    updateGoalOverride(patch);
                    setEditingGoalKey(null);
                }}
            />

            {step < 4 && (
                <div style={{ marginTop: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                    Черновая логика раскладки уже вынесена в helper и потом спокойно подкручивается коэффициентами.
                </div>
            )}

            {step === 2 && (
                <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                    Сейчас в плане: капитал {formatMoney(data.currentCapital)} ₽, пополнение {formatMoney(data.desiredMonthlyContribution)} ₽/мес.,
                    срок {normalizeAtbMassTermMonths(data.termMonths || 60)} мес.
                </div>
            )}
        </div>
    );
};

export default AtbMassFlow;
