import React from 'react';
import { SliderField, SelectField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const InvestmentForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Срок инвестирования (мес)"
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
                step={1000000}
                onChange={(val) => setEditForm({ ...editForm, initial_capital: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Ежем. пополнение"
                value={editForm.monthly_replenishment || 0}
                min={0}
                max={5000000}
                step={5000}
                onChange={(val) => setEditForm({ ...editForm, monthly_replenishment: val })}
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

export default InvestmentForm;
