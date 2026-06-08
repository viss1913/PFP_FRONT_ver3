import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { AtbMassGoalPreviewItem } from '../../utils/atbMassGoals';
import { rangeFillStyle } from '../../utils/rangeInputStyle';

interface SliderFieldProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    suffix?: string;
    highlight?: boolean;
}

function SliderField({ label, value, min, max, step, onChange, suffix = '₽', highlight = true }: SliderFieldProps) {
    const safeValue = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

    return (
        <div className="atb-goal-modal__field">
            <div className="atb-goal-modal__field-head">
                <label>{label}</label>
                <strong className={highlight ? 'atb-goal-modal__value' : undefined}>{formatMoney(safeValue, suffix)}</strong>
            </div>
            <input
                type="range"
                className="goal-modal-range"
                min={min}
                max={max}
                step={step}
                value={safeValue}
                onChange={(event) => onChange(Number(event.target.value))}
                style={rangeFillStyle(safeValue, min, max)}
            />
            <div className="atb-goal-modal__range-labels">
                <span>{formatMoney(min, suffix)}</span>
                <span>{formatMoney(max, suffix)}</span>
            </div>
        </div>
    );
}

function formatMoney(value: number, suffix = '₽'): string {
    const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
    return suffix ? `${formatted} ${suffix}` : formatted;
}

export interface AtbMassGoalEditModalProps {
    item: AtbMassGoalPreviewItem | null;
    currentCapital: number;
    desiredMonthlyContribution: number;
    reserveCapital: number;
    draftOverrides: {
        reserveInitialCapital?: number;
        reserveMonthlyReplenishment?: number;
        inheritanceInitialCapital?: number;
        pensionDesiredMonthlyIncome?: number;
        lifeTargetAmount?: number;
    };
    onClose: () => void;
    onApply: (patch: AtbMassGoalEditModalProps['draftOverrides']) => void;
}

const AtbMassGoalEditModal: React.FC<AtbMassGoalEditModalProps> = ({
    item,
    currentCapital,
    desiredMonthlyContribution,
    reserveCapital,
    draftOverrides,
    onClose,
    onApply,
}) => {
    const [draft, setDraft] = useState(draftOverrides);

    useEffect(() => {
        setDraft(draftOverrides);
    }, [draftOverrides, item?.key]);

    const goal = item?.goal;
    const summary = useMemo(() => {
        if (!item || !goal) {
            return { value: '—', suffix: '' };
        }

        switch (item.key) {
            case 'fin-reserve':
                return {
                    value: formatMoney(draft.reserveMonthlyReplenishment ?? goal.monthly_replenishment ?? 0, ''),
                    suffix: '/ мес',
                };
            case 'pension': {
                const desiredIncome = draft.pensionDesiredMonthlyIncome ?? goal.desired_monthly_income ?? 0;
                return {
                    value: formatMoney(desiredIncome, ''),
                    suffix: '/ мес',
                };
            }
            case 'life':
                return {
                    value: formatMoney(draft.lifeTargetAmount ?? goal.target_amount ?? 0, ''),
                    suffix: '',
                };
            case 'inheritance':
                return {
                    value: formatMoney(draft.inheritanceInitialCapital ?? goal.initial_capital ?? 0, ''),
                    suffix: '',
                };
            default:
                return {
                    value: formatMoney(goal.monthly_replenishment ?? goal.initial_capital ?? 0, ''),
                    suffix: '/ мес',
                };
        }
    }, [draft, goal, item]);

    if (!item || !goal) return null;

    const renderFields = () => {
        switch (item.key) {
            case 'fin-reserve':
                return (
                    <>
                        <SliderField
                            label="Стартовый резерв"
                            value={draft.reserveInitialCapital ?? goal.initial_capital ?? 0}
                            min={0}
                            max={currentCapital}
                            step={50_000}
                            onChange={(value) => setDraft((prev) => ({ ...prev, reserveInitialCapital: value }))}
                        />
                        <SliderField
                            label="Ежемесячное пополнение"
                            value={draft.reserveMonthlyReplenishment ?? goal.monthly_replenishment ?? 0}
                            min={0}
                            max={desiredMonthlyContribution}
                            step={5_000}
                            suffix="/мес."
                            onChange={(value) => setDraft((prev) => ({ ...prev, reserveMonthlyReplenishment: value }))}
                        />
                    </>
                );
            case 'inheritance':
                return (
                    <SliderField
                        label="Сумма на наследство"
                        value={draft.inheritanceInitialCapital ?? goal.initial_capital ?? 0}
                        min={0}
                        max={Math.max(0, currentCapital - reserveCapital)}
                        step={50_000}
                        onChange={(value) => setDraft((prev) => ({ ...prev, inheritanceInitialCapital: value }))}
                    />
                );
            case 'pension':
                return (
                    <SliderField
                        label="Желаемый доход (р/мес)"
                        value={draft.pensionDesiredMonthlyIncome ?? goal.desired_monthly_income ?? 0}
                        min={30_000}
                        max={300_000}
                        step={5_000}
                        suffix="/мес."
                        onChange={(value) => setDraft((prev) => ({ ...prev, pensionDesiredMonthlyIncome: value }))}
                    />
                );
            case 'life':
                return (
                    <SliderField
                        label="Лимит"
                        value={draft.lifeTargetAmount ?? goal.target_amount ?? 0}
                        min={300_000}
                        max={20_000_000}
                        step={100_000}
                        onChange={(value) => setDraft((prev) => ({ ...prev, lifeTargetAmount: value }))}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="atb-goal-modal-backdrop" onClick={onClose}>
            <div className="atb-goal-modal" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="atb-goal-modal__close" onClick={onClose} aria-label="Закрыть">
                    <X size={20} />
                </button>

                <div className="atb-goal-modal__header">
                    <span className="atb-goal-modal__pill">{item.title}</span>
                    <p className="atb-goal-modal__subtitle">Настройте параметры цели для пересчета плана</p>
                </div>

                <div className="atb-goal-modal__body">
                    <div className="atb-goal-modal__controls">{renderFields()}</div>

                    <aside className="atb-goal-modal__summary">
                        <span className="atb-goal-modal__summary-label">
                            {item.key === 'pension' ? 'Стоимость цели' : item.key === 'life' ? 'Лимит' : 'Текущий расчёт'}
                        </span>
                        <strong className="atb-goal-modal__summary-value">
                            {summary.value}
                            {summary.suffix ? <span className="atb-goal-modal__summary-suffix">{summary.suffix}</span> : null}
                        </strong>
                        {item.key === 'fin-reserve' ? (
                            <div className="atb-goal-modal__summary-note">
                                Стартовый капитал: {formatMoney(draft.reserveInitialCapital ?? goal.initial_capital ?? 0)}
                            </div>
                        ) : null}
                        {item.key === 'inheritance' ? (
                            <div className="atb-goal-modal__summary-note">
                                После сохранения остаток вернется в «Сохранить и преумножить».
                            </div>
                        ) : null}
                    </aside>
                </div>

                <div className="atb-goal-modal__footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Отмена
                    </button>
                    <button type="button" className="btn-primary" onClick={() => onApply(draft)}>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AtbMassGoalEditModal;
