import React from 'react';

export type CrmViewMode = 'clients' | 'subagents';

interface CrmViewSwitcherProps {
    mode: CrmViewMode;
    onChange: (mode: CrmViewMode) => void;
}

const CrmViewSwitcher: React.FC<CrmViewSwitcherProps> = ({ mode, onChange }) => (
    <div
        style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
        }}
    >
        {(
            [
                { id: 'clients' as const, label: 'Мои клиенты' },
                { id: 'subagents' as const, label: 'Сеть субагентов' },
            ] as const
        ).map((tab) => {
            const active = mode === tab.id;
            return (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: active ? '#fff' : 'transparent',
                        color: active ? '#111' : '#6b7280',
                        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s',
                    }}
                >
                    {tab.label}
                </button>
            );
        })}
    </div>
);

export default CrmViewSwitcher;
