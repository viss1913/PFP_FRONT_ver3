import React from 'react';
import { DollarSign } from 'lucide-react';
import type { CJMData } from '../CJMFlow';

interface StepIncomeProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepIncome: React.FC<StepIncomeProps> = ({ data, setData, onNext, onPrev }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽';

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
                    <DollarSign size={32} color="#000" />
                </div>
                <h2 className="step-title">Ваш доход</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    Укажите ваш среднемесячный доход до вычета НДФЛ
                </p>
            </div>

            <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '16px', 
                border: '1px solid var(--border-color)' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="label" style={{ marginBottom: 0 }}>Ваш ежемесячный доход (2-НДФЛ)</label>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatCurrency(data.avgMonthlyIncome)}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Это поможет нам точнее подобрать налоговые вычеты и льготы
                </p>
                <input
                    type="range"
                    min="30000"
                    max="1000000"
                    step="5000"
                    value={data.avgMonthlyIncome}
                    onChange={(e) => setData({ ...data, avgMonthlyIncome: parseInt(e.target.value) })}
                    style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>30 000 ₽</span>
                    <span>1 000 000 ₽</span>
                </div>
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

export default StepIncome;

