import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type CommissionRuleBase = 'FLOW' | 'AUM_AVG' | string;
export type CommissionRuleType = 'FIRST_YEAR_PERCENT_OF_PREMIUMS' | 'AUM_MANAGEMENT_FEE' | string;

export interface ProductCommissionRuleForm {
    rule_type: CommissionRuleType;
    base: CommissionRuleBase;
    rate_percent: number;
}

interface ProductCommissionSchemaEditorProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    rules: ProductCommissionRuleForm[];
    onRulesChange: (rules: ProductCommissionRuleForm[]) => void;
}

const ruleTypeOptions: Array<{ value: CommissionRuleType; label: string }> = [
    { value: 'FIRST_YEAR_PERCENT_OF_PREMIUMS', label: 'FIRST_YEAR_PERCENT_OF_PREMIUMS' },
    { value: 'AUM_MANAGEMENT_FEE', label: 'AUM_MANAGEMENT_FEE' },
];

const baseOptions: Array<{ value: CommissionRuleBase; label: string }> = [
    { value: 'FLOW', label: 'FLOW' },
    { value: 'AUM_AVG', label: 'AUM_AVG' },
];

const ProductCommissionSchemaEditor: React.FC<ProductCommissionSchemaEditorProps> = ({
    enabled,
    onEnabledChange,
    rules,
    onRulesChange,
}) => {
    const addRule = () => {
        onRulesChange([
            ...rules,
            {
                rule_type: 'FIRST_YEAR_PERCENT_OF_PREMIUMS',
                base: 'FLOW',
                rate_percent: 0,
            },
        ]);
    };

    const setRuleAt = (idx: number, patch: Partial<ProductCommissionRuleForm>) => {
        onRulesChange(
            rules.map((r, i) => {
                if (i !== idx) return r;
                return { ...r, ...patch };
            }),
        );
    };

    const removeRuleAt = (idx: number) => {
        onRulesChange(rules.filter((_, i) => i !== idx));
    };

    if (!enabled) {
        return (
            <div style={{ marginTop: 12 }}>
                <button
                    type="button"
                    onClick={() => onEnabledChange(true)}
                    style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: '1px dashed #ddd6fe',
                        background: '#f5f3ff',
                        color: '#5b21b6',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Задать схему комиссий
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginTop: 12 }}>
            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6' }}>Схема комиссий (version: 1)</div>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(false)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
                        aria-label="Убрать схему комиссий"
                    >
                        Убрать
                    </button>
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    {rules.map((rule, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 1fr 1fr 36px',
                                gap: 10,
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                    rule_type
                                </label>
                                <select
                                    value={rule.rule_type}
                                    onChange={(e) =>
                                        setRuleAt(idx, { rule_type: e.target.value as CommissionRuleType })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        border: '1px solid #e5e7eb',
                                        fontSize: 13,
                                        background: '#fff',
                                    }}
                                >
                                    {ruleTypeOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                    base
                                </label>
                                <select
                                    value={rule.base}
                                    onChange={(e) => setRuleAt(idx, { base: e.target.value as CommissionRuleBase })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        border: '1px solid #e5e7eb',
                                        fontSize: 13,
                                        background: '#fff',
                                    }}
                                >
                                    {baseOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                    rate_percent
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={rule.rate_percent}
                                    onChange={(e) => setRuleAt(idx, { rate_percent: Number(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        border: '1px solid #e5e7eb',
                                        fontSize: 13,
                                        background: '#fff',
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeRuleAt(idx)}
                                title="Удалить правило"
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'rgba(248,113,113,0.18)',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={addRule}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            border: '1px dashed #e5e7eb',
                            background: '#fff',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: '#374151',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Plus size={16} />
                        Добавить правило
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCommissionSchemaEditor;

