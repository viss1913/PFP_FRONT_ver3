import React from 'react';
import { SliderField, SelectField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const PensionForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Желаемый доход (р/мес)"
                value={editForm.target_amount || editForm.desired_monthly_income || 0}
                min={20000}
                max={1000000}
                step={5000}
                onChange={(val) => setEditForm({ ...editForm, target_amount: val, desired_monthly_income: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Первоначальный капитал"
                value={editForm.initial_capital || 0}
                min={0}
                max={50000000}
                step={100000}
                onChange={(val) => setEditForm({ ...editForm, initial_capital: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Капитал в ОПС (накопительная)"
                value={editForm.ops_capital || 0}
                min={0}
                max={5000000}
                step={10000}
                onChange={(val) => setEditForm({ ...editForm, ops_capital: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Текущие баллы ИПК (СФР)"
                value={editForm.ipk_current || 0}
                min={0}
                max={300}
                step={1}
                onChange={(val) => setEditForm({ ...editForm, ipk_current: val })}
            />
            <SliderField
                label="Инфляция (%)"
                value={editForm.inflation_rate || 0}
                min={0}
                max={20}
                step={0.5}
                onChange={(val) => setEditForm({ ...editForm, inflation_rate: val })}
                format={(val) => `${val}%`}
            />
            <SliderField
                label="Ваш взнос (Прямой расчет)"
                value={editForm.monthly_replenishment || 0}
                min={0}
                max={500000}
                step={1000}
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

export default PensionForm;
