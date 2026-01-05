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
    const isRent = localGoal.goal_type_id === 8; // RENT

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

            {/* Standard Goal Fields (Investment, Pension, etc) */}
            {!isLifeGoal && !isRent && (
                <>
                    <div className="input-group">
                        <label className="label">
                            {isPassiveIncome ? 'Желаемый ежемесячный доход' : 'Целевая сумма'}
                        </label>
                        <input
                            type="number"
                            value={isPassiveIncome ? (localGoal.desired_monthly_income || '') : (localGoal.target_amount || '')}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (isPassiveIncome) handleChange('desired_monthly_income', val);
                                else handleChange('target_amount', val);
                            }}
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
