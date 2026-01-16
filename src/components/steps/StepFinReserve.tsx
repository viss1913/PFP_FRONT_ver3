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
    const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));

    const handleNumberInput = (val: string, setter: (n: number) => void) => {
        const num = parseInt(val.replace(/\s/g, '')) || 0;
        setter(num);
    };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <label className="label" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: 0 }}>
                        Первоначальный капитал в цели Финансовый резерв
                    </label>
                    <input
                        type="text"
                        value={formatNumber(initialCapital)}
                        onChange={(e) => handleNumberInput(e.target.value, setInitialCapital)}
                        style={{
                            fontWeight: '800', fontSize: '20px', color: 'var(--primary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            padding: '4px 8px', width: '180px', textAlign: 'right',
                            background: 'transparent'
                        }}
                    />
                </div>
                <input
                    type="range"
                    min="0"
                    max={totalLiquidCapital || 1000000}
                    step={Math.max(1000, Math.floor((totalLiquidCapital || 1000000) / 100))}
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    style={{
                        width: '100%',
                        height: '6px',
                        background: '#E5E7EB',
                        borderRadius: '3px',
                        accentColor: 'var(--primary)',
                        cursor: 'pointer'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                    <span className="hint" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Начальная сумма для финрезерва</span>
                    {totalLiquidCapital > 0 && (
                        <button
                            type="button"
                            onClick={() => setInitialCapital(totalLiquidCapital)}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Все средства
                        </button>
                    )}
                </div>
            </div>

            {/* Monthly Replenishment Input */}
            <div className="input-group" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <label className="label" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: 0 }}>
                        Ежемесячное пополнение Финансового резерва
                    </label>
                    <input
                        type="text"
                        value={formatNumber(monthlyReplenishment)}
                        onChange={(e) => handleNumberInput(e.target.value, setMonthlyReplenishment)}
                        style={{
                            fontWeight: '800', fontSize: '20px', color: 'var(--primary)',
                            border: '1px solid var(--border-color)', borderRadius: '12px',
                            padding: '8px 16px', width: '200px', textAlign: 'right',
                            background: 'rgba(255, 200, 69, 0.05)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>
                <input
                    type="range"
                    min="0"
                    max="200000"
                    step="5000"
                    value={monthlyReplenishment}
                    onChange={(e) => setMonthlyReplenishment(Number(e.target.value))}
                    style={{
                        width: '100%',
                        height: '10px',
                        background: '#E5E7EB',
                        borderRadius: '5px',
                        accentColor: 'var(--primary)',
                        cursor: 'pointer'
                    }}
                />
                <span className="hint" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '16px', display: 'block' }}>
                    Сумма, которую вы планируете добавлять ежемесячно к финрезерву (опционально)
                </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1, padding: '16px' }}>Назад</button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    style={{ flex: 1, padding: '16px' }}
                >
                    Далее
                </button>
            </div>
        </div>
    );
};

export default StepFinReserve;

