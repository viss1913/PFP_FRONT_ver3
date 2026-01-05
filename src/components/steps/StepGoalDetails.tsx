import React, { useState } from 'react';
import type { ClientGoal } from '../../types/client';

interface StepGoalDetailsProps {
    goal: ClientGoal; // The goal being edited
    onSave: (updatedGoal: ClientGoal) => void;
    onCancel: () => void;
}

const StepGoalDetails: React.FC<StepGoalDetailsProps> = ({ goal, onSave, onCancel }) => {
    // Local state for the goal being edited
    const [localGoal, setLocalGoal] = useState<ClientGoal>({ ...goal });

    // Constants for configuration
    const isLifeGoal = localGoal.goal_type_id === 5; // Assuming 5 is Life/Safety
    const isPassiveIncome = localGoal.goal_type_id === 2; // Passive Income
    const isPension = localGoal.goal_type_id === 1; // Pension (как Пассивный доход)
    const isRent = localGoal.goal_type_id === 8; // RENT
    const isFinReserve = localGoal.goal_type_id === 7; // FIN_RESERVE

    const handleSave = () => {
        onSave(localGoal);
    };

    const handleChange = (field: keyof ClientGoal, value: any) => {
        setLocalGoal(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>
                {isLifeGoal ? 'Параметры страхования' : `Параметры цели "${localGoal.name}"`}
            </h3>

            {/* Life Insurance Specific Fields */}
            {isLifeGoal && (
                <>
                    <div className="input-group">
                        <label className="label">Страховая сумма (Лимит)</label>
                        <input
                            type="number"
                            value={localGoal.insurance_limit || localGoal.target_amount || ''}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setLocalGoal(prev => ({
                                    ...prev,
                                    insurance_limit: val,
                                    target_amount: val
                                }));
                            }}
                            placeholder="Например: 10 000 000"
                        />
                        <span className="hint">Сумма, которую выплатят при наступлении страхового случая</span>
                    </div>

                    <div className="input-group">
                        <label className="label">Срок страхования (лет)</label>
                        <input
                            type="number"
                            value={Math.floor((localGoal.term_months || 0) / 12) || ''}
                            onChange={(e) => handleChange('term_months', Number(e.target.value) * 12)}
                            placeholder="Например: 20"
                        />
                    </div>
                </>
            )}

            {/* RENT Goal Fields */}
            {isRent && (
                <>
                    <div className="input-group">
                        <label className="label">Капитал</label>
                        <input
                            type="number"
                            value={localGoal.initial_capital || ''}
                            onChange={(e) => handleChange('initial_capital', Number(e.target.value))}
                            placeholder="Например: 5 000 000"
                        />
                        <span className="hint">Сумма капитала, с которого будет получаться рента</span>
                    </div>
                </>
            )}

            {/* FIN_RESERVE Goal Fields */}
            {isFinReserve && (
                <>
                    <div className="input-group">
                        <label className="label">Начальный капитал</label>
                        <input
                            type="number"
                            value={localGoal.initial_capital || ''}
                            onChange={(e) => handleChange('initial_capital', Number(e.target.value))}
                            placeholder="Например: 300 000"
                        />
                        <span className="hint">Начальная сумма для финрезерва</span>
                    </div>

                    <div className="input-group">
                        <label className="label">Ежемесячное пополнение</label>
                        <input
                            type="number"
                            value={localGoal.monthly_replenishment || ''}
                            onChange={(e) => handleChange('monthly_replenishment', Number(e.target.value))}
                            placeholder="0"
                        />
                        <span className="hint">Сумма, которую вы планируете добавлять ежемесячно (опционально)</span>
                    </div>
                </>
            )}

            {/* PENSION and PASSIVE_INCOME Goal Fields (без срока) */}
            {(isPension || isPassiveIncome) && (
                <>
                    <div className="input-group">
                        <label className="label">Желаемый ежемесячный доход</label>
                        <input
                            type="number"
                            value={localGoal.desired_monthly_income || ''}
                            onChange={(e) => handleChange('desired_monthly_income', Number(e.target.value))}
                            placeholder="0"
                        />
                        <span className="hint">Сумма, которую вы хотите получать ежемесячно</span>
                    </div>

                    <div className="input-group">
                        <label className="label">Инфляция (%)</label>
                        <input
                            type="number"
                            value={localGoal.inflation_rate || 10}
                            onChange={(e) => handleChange('inflation_rate', Number(e.target.value))}
                        />
                    </div>
                </>
            )}

            {/* Standard Goal Fields (Investment, etc) */}
            {!isLifeGoal && !isRent && !isFinReserve && !isPension && !isPassiveIncome && (
                <>
                    <div className="input-group">
                        <label className="label">Целевая сумма</label>
                        <input
                            type="number"
                            value={localGoal.target_amount || ''}
                            onChange={(e) => handleChange('target_amount', Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Срок (лет)</label>
                        <input
                            type="number"
                            value={Math.floor((localGoal.term_months || 0) / 12) || ''}
                            onChange={(e) => handleChange('term_months', Number(e.target.value) * 12)}
                            placeholder="10"
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Инфляция (%)</label>
                        <input
                            type="number"
                            value={localGoal.inflation_rate || 10}
                            onChange={(e) => handleChange('inflation_rate', Number(e.target.value))}
                        />
                    </div>
                </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Отмена</button>
                <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>Сохранить</button>
            </div>
        </div>
    );
};

export default StepGoalDetails;
