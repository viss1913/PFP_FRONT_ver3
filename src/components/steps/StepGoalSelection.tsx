import React from 'react';
import type { CJMData } from '../CJMFlow';
import { TrendingUp, Wallet, Home, GraduationCap, Briefcase } from 'lucide-react';

interface StepProps {
    data: CJMData;
    setData: (data: CJMData) => void;
    onNext: () => void;
    onPrev: () => void;
}

const goals = [
    { id: 3, name: 'Сохранить и преумножить', icon: <TrendingUp size={24} />, desc: 'Инвестиции для роста капитала', defaultAmount: 1500000 },
    { id: 2, name: 'Ежемесячный доход', icon: <Wallet size={24} />, desc: 'Доход с имеющегося капитала', defaultAmount: 100000 },
    { id: 4, name: 'Квартира', icon: <Home size={24} />, desc: 'Накопление на недвижимость', defaultAmount: 5000000 },
    { id: 7, name: 'Детский капитал', icon: <GraduationCap size={24} />, desc: 'Обеспечение будущего детей', defaultAmount: 1000000 },
    { id: 1, name: 'Пенсия', icon: <Briefcase size={24} />, desc: 'Достойная жизнь в будущем', defaultAmount: 80000 }
];

const StepGoalSelection: React.FC<StepProps> = ({ data, setData, onNext, onPrev }) => {
    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Выберите цель</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {goals.map((g) => (
                    <button
                        key={g.id}
                        style={{
                            textAlign: 'left',
                            padding: '20px',
                            borderRadius: '16px',
                            border: `2px solid ${data.goalTypeId === g.id ? 'var(--primary)' : 'var(--border-color)'}`,
                            background: data.goalTypeId === g.id ? 'rgba(255,199,80,0.1)' : 'rgba(255,255,255,0.03)',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => setData({ ...data, goalTypeId: g.id, goalName: g.name, targetAmount: g.defaultAmount })}
                    >
                        <div style={{ color: data.goalTypeId === g.id ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '12px' }}>
                            {g.icon}
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{g.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.desc}</div>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={onPrev}>Назад</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={onNext}>Далее</button>
            </div>
        </div>
    );
};

export default StepGoalSelection;
