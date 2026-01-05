import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
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
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '18px' }}>
                    Укажите параметры для цели "Финансовый резерв"
                </p>
            </div>

            {/* Total Capital Info */}
            <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                background: 'var(--card-bg)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '16px', 
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-soft)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Доступный капитал</span>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '24px' }}>
                        {formatCurrency(totalLiquidCapital)}
                    </span>
                </div>
            </div>

            {/* Initial Capital Input */}
            <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="label" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
                    Первоначальный капитал в цели Финансовый резерв
                </label>
                <input
                    type="number"
                    min="0"
                    max={totalLiquidCapital}
                    step="10000"
                    value={initialCapital || ''}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    placeholder="0"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
                    <span className="hint" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Начальная сумма для финрезерва</span>
                    {totalLiquidCapital > 0 && (
                        <button
                            type="button"
                            onClick={() => setInitialCapital(totalLiquidCapital)}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 199, 80, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            Все средства
                        </button>
                    )}
                </div>
            </div>

            {/* Monthly Replenishment Input */}
            <div className="input-group" style={{ marginBottom: '40px' }}>
                <label className="label" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
                    Ежемесячное пополнение Финансового резерва
                </label>
                <input
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlyReplenishment || ''}
                    onChange={(e) => setMonthlyReplenishment(Number(e.target.value))}
                    placeholder="0"
                />
                <span className="hint" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Сумма, которую вы планируете добавлять ежемесячно к финрезерву (опционально)
                </span>
            </div>

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

