import React, { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp } from 'lucide-react';
import type { CJMData } from '../CJMFlow';

interface StepFinReserveProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepFinReserve: React.FC<StepFinReserveProps> = ({ data, setData, onNext, onPrev }) => {
    // Calculate total liquid capital from assets
    const totalLiquidCapital = (data.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);
    
    // Initialize with default values if not set
    const [initialCapital, setInitialCapital] = useState<number>(data.initialCapital || 0);
    const [monthlyReplenishment, setMonthlyReplenishment] = useState<number>(data.monthlyReplenishment || 0);

    // Update data when values change
    useEffect(() => {
        setData(prev => ({
            ...prev,
            initialCapital,
            monthlyReplenishment
        }));
    }, [initialCapital, monthlyReplenishment, setData]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' ₽';

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: 'var(--primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <PiggyBank size={32} color="#000" />
                </div>
                <h2 className="step-title">Финансовый резерв</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    Выделите часть средств на финансовый резерв для ваших целей
                </p>
            </div>

            {/* Total Capital Info */}
            <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '16px', 
                border: '1px solid var(--border-color)' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Доступный капитал</span>
                    <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '18px' }}>
                        {formatCurrency(totalLiquidCapital)}
                    </span>
                </div>
            </div>

            {/* Initial Capital Input */}
            <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="label">
                    Первоначальный капитал для целей
                </label>
                <input
                    type="number"
                    min="0"
                    max={totalLiquidCapital}
                    step="10000"
                    value={initialCapital || ''}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    placeholder="0"
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '16px'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span className="hint">Часть средств, которую вы хотите выделить на цели</span>
                    {totalLiquidCapital > 0 && (
                        <button
                            type="button"
                            onClick={() => setInitialCapital(totalLiquidCapital)}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Все средства
                        </button>
                    )}
                </div>
            </div>

            {/* Monthly Replenishment Input */}
            <div className="input-group" style={{ marginBottom: '30px' }}>
                <label className="label">
                    Ежемесячное пополнение
                </label>
                <input
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlyReplenishment || ''}
                    onChange={(e) => setMonthlyReplenishment(Number(e.target.value))}
                    placeholder="0"
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '16px'
                    }}
                />
                <span className="hint">Сумма, которую вы планируете добавлять ежемесячно к целям</span>
            </div>

            {/* Summary */}
            {(initialCapital > 0 || monthlyReplenishment > 0) && (
                <div style={{ 
                    marginBottom: '30px', 
                    padding: '20px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <TrendingUp size={20} color="#10b981" />
                        <span style={{ fontWeight: '600', color: '#10b981' }}>Итого</span>
                    </div>
                    {initialCapital > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Первоначальный капитал:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>{formatCurrency(initialCapital)}</span>
                        </div>
                    )}
                    {monthlyReplenishment > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Ежемесячное пополнение:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>{formatCurrency(monthlyReplenishment)}</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>Назад</button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    style={{ flex: 1 }}
                >
                    Далее
                </button>
            </div>
        </div>
    );
};

export default StepFinReserve;

