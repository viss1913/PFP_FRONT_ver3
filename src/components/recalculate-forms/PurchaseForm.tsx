import React from 'react';
import { SliderField, SelectField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const PurchaseForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Стоимость покупки"
                value={editForm.target_amount || 0}
                min={100000}
                max={200000000}
                step={500000}
                onChange={(val) => setEditForm({ ...editForm, target_amount: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Срок до покупки (мес)"
                value={editForm.term_months || 0}
                min={1}
                max={360}
                step={1}
                onChange={(val) => setEditForm({ ...editForm, term_months: val })}
            />
            <SliderField
                label="Стартовый капитал"
                value={editForm.initial_capital || 0}
                min={0}
                max={50000000}
                step={100000}
                onChange={(val) => setEditForm({ ...editForm, initial_capital: val })}
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
                label="Инфляция объекта (%)"
                value={editForm.inflation_rate || 0}
                min={0}
                max={30}
                step={1}
                onChange={(val) => setEditForm({ ...editForm, inflation_rate: val })}
                format={(val) => `${val}%`}
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

export default PurchaseForm;
