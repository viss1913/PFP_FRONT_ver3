import React from 'react';
import type { CJMData } from '../CJMFlow';

interface StepProps {
    data: CJMData;
    setData: (data: CJMData) => void;
    onNext: () => void;
    onPrev: () => void;
}

const StepGoalDetails: React.FC<StepProps> = ({ data, setData, onNext, onPrev }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽';
    const isInvestment = data.goalTypeId === 3;

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>{data.goalName}</h2>

            {!isInvestment && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="label">Сумма цели</label>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatCurrency(data.targetAmount)}</span>
                    </div>
                    <input
                        type="range"
                        min="100000"
                        max="20000000"
                        step="100000"
                        value={data.targetAmount}
                        onChange={(e) => setData({ ...data, targetAmount: parseInt(e.target.value) })}
                    />
                </div>
            )}

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="label">Срок (месяцев)</label>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{data.termMonths} мес.</span>
                </div>
                <input
                    type="range"
                    min="6"
                    max="360"
                    step="6"
                    value={data.termMonths}
                    onChange={(e) => setData({ ...data, termMonths: parseInt(e.target.value) })}
                />
            </div>

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="label">Первоначальный капитал</label>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatCurrency(data.initialCapital)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10000000"
                    step="50000"
                    value={data.initialCapital}
                    onChange={(e) => setData({ ...data, initialCapital: parseInt(e.target.value) })}
                />
            </div>

            {isInvestment && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="label">Ежемесячное пополнение</label>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatCurrency(data.monthlyReplenishment)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="500000"
                        step="5000"
                        value={data.monthlyReplenishment}
                        onChange={(e) => setData({ ...data, monthlyReplenishment: parseInt(e.target.value) })}
                    />
                </div>
            )}

            {!isInvestment && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="label">Ежемесячный доход (2-НДФЛ)</label>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatCurrency(data.avgMonthlyIncome)}</span>
                    </div>
                    <input
                        type="range"
                        min="30000"
                        max="1000000"
                        step="5000"
                        value={data.avgMonthlyIncome}
                        onChange={(e) => setData({ ...data, avgMonthlyIncome: parseInt(e.target.value) })}
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: isInvestment ? '40px' : '0' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={onPrev}>Назад</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={onNext}>Далее</button>
            </div>
        </div>
    );
};

export default StepGoalDetails;
