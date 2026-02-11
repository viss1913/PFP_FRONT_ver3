import React from 'react';
import { SliderField, SelectField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const RentForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Стартовый капитал"
                value={editForm.initial_capital || 0}
                min={0}
                max={100000000}
                step={50000}
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

export default RentForm;
