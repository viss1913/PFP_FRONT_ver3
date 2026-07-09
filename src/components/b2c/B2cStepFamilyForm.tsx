import React from 'react';
import { ArrowRight, Calendar, Mail, Trash2, User } from 'lucide-react';
import type { CJMData, ClientCreditType, FamilyObligation, FamilyRealEstateStatus } from '../CJMFlow';
import B2cFamilyAccordion from './B2cFamilyAccordion';

type OpenSections = {
    expenses: boolean;
    real_estate: boolean;
    credits: boolean;
    children: boolean;
    income: boolean;
};

interface B2cStepFamilyFormProps {
    data: CJMData;
    family: CJMData['familyProfile'];
    openSections: OpenSections;
    toggleSection: (key: keyof OpenSections) => void;
    clientBirthDateDraft: string;
    childBirthDateDrafts: Record<number, string>;
    onClientFieldChange: (field: 'fio' | 'email', value: string) => void;
    onClientBirthDateChange: (value: string) => void;
    onNext: () => void;
    onPrev?: () => void;
    showBack?: boolean;
    formValid: boolean;
    isMarried: boolean;
    spouseIncomeLabel: string;
    obligations: { value: FamilyObligation; label: string }[];
    obligationIcon: Record<FamilyObligation, React.ReactNode>;
    estateStatuses: { value: FamilyRealEstateStatus; label: string }[];
    realEstateTypeOptions: readonly string[];
    creditTypeOptions: Array<{ value: ClientCreditType; label: string }>;
    formatMoneyInput: (value: number) => string;
    parseMoneyInput: (value: string) => number;
    updateObligationByType: (type: FamilyObligation, amount: number) => void;
    updateEstate: (index: number, patch: { name?: string; estimated_value?: number; status?: FamilyRealEstateStatus }) => void;
    addEstate: () => void;
    updateCredit: (index: number, patch: Partial<CJMData['familyProfile']['credits'][number]>) => void;
    addCredit: () => void;
    removeCredit: (index: number) => void;
    updateChild: (index: number, patch: Partial<CJMData['familyProfile']['children'][number]>) => void;
    addChild: () => void;
    removeChild: (index: number) => void;
    setChildBirthDateDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    normalizeRuDateInput: (value: string) => string;
    parseRuDateToIso: (ruDate: string) => string | null;
    formatIsoToRuDate: (isoDate?: string) => string;
}

const B2cStepFamilyForm: React.FC<B2cStepFamilyFormProps> = ({
    data,
    family,
    openSections,
    toggleSection,
    clientBirthDateDraft,
    childBirthDateDrafts,
    onClientFieldChange,
    onClientBirthDateChange,
    onNext,
    onPrev,
    showBack = true,
    formValid,
    isMarried,
    spouseIncomeLabel,
    obligations,
    obligationIcon,
    estateStatuses,
    realEstateTypeOptions,
    creditTypeOptions,
    formatMoneyInput,
    parseMoneyInput,
    updateObligationByType,
    updateEstate,
    addEstate,
    updateCredit,
    addCredit,
    removeCredit,
    updateChild,
    addChild,
    removeChild,
    setChildBirthDateDrafts,
    setData,
    normalizeRuDateInput,
    parseRuDateToIso,
    formatIsoToRuDate,
}) => (
    <div className="b2c-step-family">
        <div className="b2c-step-family__content">
            <header className="b2c-step-client__header b2c-step-family__header">
                <h2 className="b2c-step-client__title">Расскажите о себе</h2>
                <p className="b2c-step-client__subtitle">
                    Эти данные нужны только для построения вашего финансового плана
                </p>
            </header>

            <div className="b2c-step-family__identity-grid">
                <div className="b2c-step-client__field">
                    <label className="b2c-step-client__label" htmlFor="b2c-family-fio">
                        ФИО
                    </label>
                    <div className="b2c-step-client__input-wrap">
                        <User size={18} className="b2c-step-client__input-icon" aria-hidden />
                        <input
                            id="b2c-family-fio"
                            type="text"
                            className="b2c-step-client__input"
                            value={data.fio || ''}
                            onChange={(e) => onClientFieldChange('fio', e.target.value)}
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>
                </div>

                <div className="b2c-step-client__field b2c-step-client__field--with-hint">
                    <label className="b2c-step-client__label" htmlFor="b2c-family-email">
                        Email
                    </label>
                    <div className="b2c-step-client__input-wrap">
                        <Mail size={18} className="b2c-step-client__input-icon" aria-hidden />
                        <input
                            id="b2c-family-email"
                            type="email"
                            className="b2c-step-client__input"
                            value={data.email || ''}
                            onChange={(e) => onClientFieldChange('email', e.target.value)}
                            placeholder="email@example.com"
                            autoComplete="email"
                        />
                    </div>
                    <p className="b2c-step-client__hint">
                        Пароль не нужен — по email сохраним план и откроем отчёт.
                    </p>
                </div>
            </div>

            <div className="b2c-step-client__field b2c-step-family__birth-field">
                <label className="b2c-step-client__label" htmlFor="b2c-family-birth">
                    Дата рождения
                </label>
                <div className="b2c-step-client__input-wrap">
                    <Calendar size={18} className="b2c-step-client__input-icon" aria-hidden />
                    <input
                        id="b2c-family-birth"
                        type="text"
                        inputMode="numeric"
                        className="b2c-step-client__input"
                        value={clientBirthDateDraft}
                        onChange={(e) => onClientBirthDateChange(e.target.value)}
                        placeholder="ДД.ММ.ГГГГ"
                    />
                </div>
            </div>

            <div className="b2c-step-family__accordions">
            <B2cFamilyAccordion
                id="b2c-family-expenses"
                title="Расходы семьи (в месяц)"
                subtitle="Кредиты, ипотека, аренда, алименты, обучение детей и другие обязательные расходы"
                open={openSections.expenses}
                onToggle={() => toggleSection('expenses')}
            >
                <div className="b2c-step-family__rows">
                    {obligations.map((item) => {
                        const current = family.family_obligations.find((x) => x.type === item.value);
                        const amount = current?.amount_monthly || 0;
                        return (
                            <div key={item.value} className="b2c-step-family__row">
                                <span className="b2c-step-family__row-label">
                                    <span className="b2c-step-family__row-icon">{obligationIcon[item.value]}</span>
                                    {item.label}
                                    {item.value === 'other' ? (
                                        <span className="b2c-step-family__row-hint"> (еда, транспорт, связь)</span>
                                    ) : null}
                                </span>
                                <div className="b2c-step-family__money-input">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(amount)}
                                        onChange={(e) => updateObligationByType(item.value, parseMoneyInput(e.target.value))}
                                        placeholder="0"
                                    />
                                    <span>₽</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </B2cFamilyAccordion>

            <B2cFamilyAccordion
                id="b2c-family-estate"
                title="Недвижимость семьи"
                subtitle={
                    family.real_estate.length > 0
                        ? `${family.real_estate.length} объект(ов) недвижимости`
                        : 'Пока нет объектов недвижимости'
                }
                open={openSections.real_estate}
                onToggle={() => toggleSection('real_estate')}
            >
                {family.real_estate.length > 0 ? (
                    <div className="b2c-step-family__grid-head b2c-step-family__grid-head--estate">
                        <span>Тип недвижимости</span>
                        <span>Стоимость</span>
                        <span>Тип собственности</span>
                    </div>
                ) : null}
                {family.real_estate.map((item, index) => (
                    <div key={index} className="b2c-step-family__grid-row b2c-step-family__grid-row--estate">
                        <select
                            value={item.name || 'Квартира'}
                            onChange={(e) => updateEstate(index, { name: e.target.value })}
                        >
                            {realEstateTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <div className="b2c-step-family__money-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(item.estimated_value || 0)}
                                onChange={(e) => updateEstate(index, { estimated_value: parseMoneyInput(e.target.value) })}
                                placeholder="0"
                            />
                            <span>₽</span>
                        </div>
                        <select
                            value={item.status || 'owned'}
                            onChange={(e) => updateEstate(index, { status: e.target.value as FamilyRealEstateStatus })}
                        >
                            {estateStatuses.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                <button type="button" className="b2c-step-family__add-btn" onClick={addEstate}>
                    + Добавить недвижимость
                </button>
            </B2cFamilyAccordion>

            <B2cFamilyAccordion
                id="b2c-family-credits"
                title="Кредиты клиента"
                subtitle={family.credits.length > 0 ? `${family.credits.length} кредит(ов)` : 'Пока нет кредитов'}
                open={openSections.credits}
                onToggle={() => toggleSection('credits')}
            >
                {family.credits.length > 0 ? (
                    <div className="b2c-step-family__grid-head b2c-step-family__grid-head--credits">
                        <span>Тип</span>
                        <span>Остаток</span>
                        <span>Платёж / мес</span>
                        <span>Ставка</span>
                        <span />
                    </div>
                ) : null}
                {family.credits.map((item, index) => (
                    <div key={index} className="b2c-step-family__grid-row b2c-step-family__grid-row--credits">
                        <select
                            value={item.type}
                            onChange={(e) => updateCredit(index, { type: e.target.value as ClientCreditType })}
                        >
                            {creditTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="b2c-step-family__money-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(item.balance || 0)}
                                onChange={(e) => updateCredit(index, { balance: parseMoneyInput(e.target.value) })}
                                placeholder="0"
                            />
                            <span>₽</span>
                        </div>
                        <div className="b2c-step-family__money-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(item.monthlyPayment || 0)}
                                onChange={(e) => updateCredit(index, { monthlyPayment: parseMoneyInput(e.target.value) })}
                                placeholder="0"
                            />
                            <span>₽</span>
                        </div>
                        <div className="b2c-step-family__rate-input">
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.1"
                                value={item.rate || 0}
                                onChange={(e) => updateCredit(index, { rate: Number(e.target.value) || 0 })}
                                placeholder="0"
                            />
                            <span>%</span>
                        </div>
                        <button
                            type="button"
                            className="b2c-step-family__icon-btn"
                            onClick={() => removeCredit(index)}
                            aria-label="Удалить кредит"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" className="b2c-step-family__add-btn" onClick={addCredit}>
                    + Добавить кредит
                </button>
            </B2cFamilyAccordion>

            <B2cFamilyAccordion
                id="b2c-family-children"
                title="Дети"
                subtitle={
                    family.children.length > 0
                        ? `${family.children.length} ребёнок(детей) в списке`
                        : 'Пока нет данных о детях'
                }
                open={openSections.children}
                onToggle={() => toggleSection('children')}
            >
                {family.children.length > 0 ? (
                    <p className="b2c-step-family__note">
                        У каждого ребёнка укажи имя — без него не собрать цель «Образование».
                    </p>
                ) : null}
                {family.children.map((child, index) => (
                    <div key={index} className="b2c-step-family__grid-row b2c-step-family__grid-row--children">
                        <input
                            type="text"
                            value={child.first_name || ''}
                            onChange={(e) => updateChild(index, { first_name: e.target.value })}
                            placeholder="Имя ребёнка"
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={childBirthDateDrafts[index] ?? formatIsoToRuDate(child.birth_date)}
                            onChange={(e) => {
                                const normalized = normalizeRuDateInput(e.target.value);
                                setChildBirthDateDrafts((prev) => ({ ...prev, [index]: normalized }));
                                const iso = parseRuDateToIso(normalized);
                                if (iso) {
                                    updateChild(index, { birth_date: iso });
                                } else if (!normalized) {
                                    updateChild(index, { birth_date: '' });
                                }
                            }}
                            placeholder="ДД.ММ.ГГГГ"
                        />
                        <button
                            type="button"
                            className="b2c-step-family__icon-btn"
                            onClick={() => removeChild(index)}
                            aria-label="Удалить ребёнка"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" className="b2c-step-family__add-btn" onClick={addChild}>
                    + Добавить ребёнка
                </button>
            </B2cFamilyAccordion>

            <B2cFamilyAccordion
                id="b2c-family-income"
                title="Доходы семьи"
                subtitle={
                    !openSections.income && (data.avgMonthlyIncome || 0) > 0
                        ? `Доход клиента: ${formatMoneyInput(data.avgMonthlyIncome || 0)} ₽`
                        : undefined
                }
                open={openSections.income}
                onToggle={() => toggleSection('income')}
            >
                <div className="b2c-step-family__rows">
                    <div className="b2c-step-family__row">
                        <span className="b2c-step-family__row-label">Доход клиента (по 2-НДФЛ) (в месяц)</span>
                        <div className="b2c-step-family__money-input">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(data.avgMonthlyIncome || 0)}
                                onChange={(e) =>
                                    setData((prev) => ({ ...prev, avgMonthlyIncome: parseMoneyInput(e.target.value) }))
                                }
                                placeholder="0"
                            />
                            <span>₽</span>
                        </div>
                    </div>
                    {isMarried ? (
                        <div className="b2c-step-family__row">
                            <span className="b2c-step-family__row-label">{spouseIncomeLabel}</span>
                            <div className="b2c-step-family__money-input">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInput(family.spouse?.monthly_income ?? 0)}
                                    onChange={(e) =>
                                        setData((prev) => ({
                                            ...prev,
                                            familyProfile: {
                                                ...prev.familyProfile,
                                                spouse: {
                                                    ...prev.familyProfile.spouse,
                                                    monthly_income: parseMoneyInput(e.target.value),
                                                },
                                            },
                                        }))
                                    }
                                    placeholder="0"
                                />
                                <span>₽</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            </B2cFamilyAccordion>
            </div>
        </div>

        <div className={`b2c-step-family__actions${showBack ? '' : ' b2c-step-family__actions--solo'}`}>
            {showBack && onPrev ? (
                <button type="button" className="b2c-step-family__back" onClick={onPrev}>
                    Назад
                </button>
            ) : null}
            <button type="button" className="b2c-step-client__next" onClick={onNext} disabled={!formValid}>
                Далее
                <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
            </button>
        </div>
    </div>
);

export default B2cStepFamilyForm;
