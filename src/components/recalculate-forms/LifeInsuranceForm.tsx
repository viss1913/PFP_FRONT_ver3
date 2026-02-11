import React from 'react';
import { SliderField } from './SharedFields';
import type { BaseFormProps } from './SharedFields';

const LifeInsuranceForm: React.FC<BaseFormProps> = ({ editForm, setEditForm, formatCurrency }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderField
                label="Страховая сумма"
                value={editForm.target_amount || 0}
                min={500000}
                max={100000000}
                step={500000}
                onChange={(val) => setEditForm({ ...editForm, target_amount: val })}
                format={formatCurrency}
            />
            <SliderField
                label="Срок программы (мес)"
                value={editForm.term_months || 0}
                min={60}
                max={480}
                step={12}
                onChange={(val) => setEditForm({ ...editForm, term_months: val })}
            />
        </div>
    );
};

export default LifeInsuranceForm;
