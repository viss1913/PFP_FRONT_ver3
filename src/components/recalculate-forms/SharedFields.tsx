import React from 'react';

export interface SliderFieldProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    format?: (val: number) => string;
}

export const SliderField: React.FC<SliderFieldProps> = ({ label, value, min, max, step, onChange, format }) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>{label}</label>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                    {format ? format(value) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    width: '100%',
                    height: '6px',
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(value - min) / (max - min) * 100}%, #eee ${(value - min) / (max - min) * 100}%, #eee 100%)`,
                    borderRadius: '3px',
                    appearance: 'none',
                    outline: 'none',
                    cursor: 'pointer'
                }}
                className="custom-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#999' }}>
                <span>{format ? format(min) : min}</span>
                <span>{format ? format(max) : max}</span>
            </div>
            <style>{`
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #fff;
          border: 3px solid var(--primary);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.1s;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
};

export interface SelectFieldProps {
    label: string;
    value: string;
    options: string[];
    onChange: (val: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange }) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
                {label}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
                {options.map((opt: string) => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px solid',
                            borderColor: value === opt ? 'var(--primary)' : '#eee',
                            background: value === opt ? 'var(--primary-light)' : '#fff',
                            color: value === opt ? 'var(--primary)' : '#666',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '13px'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export interface BaseFormProps {
    editForm: any;
    setEditForm: (form: any) => void;
    formatCurrency: (val: number) => string;
}
