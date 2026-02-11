import React from 'react';
import { SliderField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const FinReserveForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
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
            <SliderField
                label="Ежем. пополнение"
                value={editForm.monthly_replenishment || 0}
                min={0}
                max={5000000}
                step={5000}
                onChange={(val) => setEditForm({ ...editForm, monthly_replenishment: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Срок накопления (мес)"
                value={editForm.term_months || 0}
                min={1}
                max={120}
                step={1}
                onChange={(val) => setEditForm({ ...editForm, term_months: val })}
            />
        </div>
    );
};

export default FinReserveForm;
