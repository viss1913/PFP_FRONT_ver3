import React from 'react';
import { SliderField, SelectField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const PassiveIncomeForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Желаемый доход"
                value={editForm.target_amount || 0}
                min={10000}
                max={2000000}
                step={5000}
                onChange={(val) => setEditForm({ ...editForm, target_amount: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Ваш взнос (Прямой расчет)"
                value={editForm.monthly_replenishment || 0}
                min={0}
                max={1000000}
                step={5000}
                onChange={(val) => setEditForm({ ...editForm, monthly_replenishment: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Срок накопления (мес)"
                value={editForm.term_months || 0}
                min={12}
                max={600}
                step={12}
                onChange={(val) => setEditForm({ ...editForm, term_months: val })}
            />
            <SliderField
                label="Стартовый капитал"
                value={editForm.initial_capital || 0}
                min={0}
                max={100000000}
                step={500000}
                onChange={(val) => setEditForm({ ...editForm, initial_capital: val })}
                format={formatCurrency}
            />
            <SelectField
                label="Риск-профиль"
                value={editForm.risk_profile || 'BALANCED'}
                options={['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']}
                onChange={(val) => setEditForm({ ...editForm, risk_profile: val })}
            />
        </div>
    );
};

export default PassiveIncomeForm;
