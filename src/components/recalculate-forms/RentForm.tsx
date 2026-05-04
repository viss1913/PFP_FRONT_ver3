import React from 'react';
import {
    RISK_PROFILE_SELECT_OPTIONS,
    extendedToLegacy,
    legacyToExtended,
} from '../../constants/portfolioRiskProfiles';
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
                value={editForm.risk_profile_extended || legacyToExtended(editForm.risk_profile || 'BALANCED')}
                options={RISK_PROFILE_SELECT_OPTIONS}
                onChange={(val) =>
                    setEditForm({
                        ...editForm,
                        risk_profile_extended: val,
                        risk_profile: extendedToLegacy(val),
                    })
                }
            />
        </div>
    );
};

export default RentForm;
