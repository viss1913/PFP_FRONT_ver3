import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, Shield, Home, GraduationCap, Leaf, Coins } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import type { ClientGoal } from '../../types/client';
import StepGoalDetails from './StepGoalDetails';

interface StepGoalSelectionProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

// Goal Types mapping (ID -> Icon/Name)
// НСЖ (id=5) убрано из списка - не показываем и не отправляем на расчет
const GOAL_TYPES = [
    { id: 1, name: 'Пенсия', icon: <Leaf size={24} />, description: 'На старость' },
    { id: 2, name: 'Пассивный доход', icon: <Leaf size={24} />, description: 'Жить на проценты' },
    { id: 3, name: 'Крупная покупка', icon: <Target size={24} />, description: 'Авто, дача и т.д.' }, // Generic Investment/Purchase
    { id: 4, name: 'Недвижимость', icon: <Home size={24} />, description: 'Квартира, дом' },
    { id: 6, name: 'Образование', icon: <GraduationCap size={24} />, description: 'Детям или себе' },
    { id: 7, name: 'Финансовый резерв', icon: <Shield size={24} />, description: 'Финрезерв на год' },
    { id: 8, name: 'Рента', icon: <Coins size={24} />, description: 'Пассивный доход от капитала' },
];

const StepGoalSelection: React.FC<StepGoalSelectionProps> = ({ data, setData, onNext, onPrev }) => {
    const goals = data.goals || [];
    const [editingGoal, setEditingGoal] = useState<ClientGoal | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);

    // НСЖ убрано из фронтенда - не добавляем автоматически

    const handleAddGoal = (typeId: number) => {
        const typeInfo = GOAL_TYPES.find(t => t.id === typeId);
        const isRent = typeId === 8;
        const isFinReserve = typeId === 7;
        const isPension = typeId === 1; // Пенсия как Пассивный доход - без срока
        const isPassiveIncome = typeId === 2; // Пассивный доход - без срока
        const newGoal: ClientGoal = {
            goal_type_id: typeId,
            name: typeInfo?.name || 'Новая цель',
            target_amount: isRent ? undefined : (isFinReserve ? undefined : (isPension || isPassiveIncome ? undefined : 0)),
            term_months: isRent ? undefined : (isFinReserve ? 12 : (isPension || isPassiveIncome ? undefined : 120)), // FIN_RESERVE: 12 months, RENT/PENSION/PASSIVE_INCOME: undefined, others: 120
            risk_profile: data.riskProfile || 'BALANCED',
            initial_capital: isFinReserve ? 0 : undefined, // Only for FIN_RESERVE, бэк сам распределит для остальных
            monthly_replenishment: isFinReserve ? 0 : undefined, // For FIN_RESERVE, set monthly_replenishment
            desired_monthly_income: (isPension || isPassiveIncome) ? undefined : undefined // For PENSION and PASSIVE_INCOME
        };

        // Open Editor immediately
        setEditingGoal(newGoal);
        setEditingIndex(-1); // -1 indicates new goal
        setIsAddingMode(false);
    };

    const handleEditGoal = (index: number) => {
        setEditingGoal(goals[index]);
        setEditingIndex(index);
    };

    const handleDeleteGoal = (index: number) => {
        const newGoals = [...goals];
        newGoals.splice(index, 1);
        setData(prev => ({ ...prev, goals: newGoals }));
    };

    const handleSaveGoal = (updatedGoal: ClientGoal) => {
        if (editingIndex === -1) {
            // Add new
            setData(prev => ({ ...prev, goals: [...(prev.goals || []), updatedGoal] }));
        } else if (editingIndex !== null) {
            // Update existing
            const newGoals = [...goals];
            newGoals[editingIndex] = updatedGoal;
            setData(prev => ({ ...prev, goals: newGoals }));
        }
        setEditingGoal(null);
        setEditingIndex(null);
    };

    // If editing, show form
    if (editingGoal) {
        return (
            <StepGoalDetails
                goal={editingGoal}
                onSave={handleSaveGoal}
                onCancel={() => { setEditingGoal(null); setEditingIndex(null); }}
            />
        );
    }

    // If Adding Mode, show gallery
    if (isAddingMode) {
        return (
            <div style={{ textAlign: 'center' }}>
                <h2 className="step-title">Выберите тип цели</h2>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                    gap: '24px', 
                    marginBottom: '40px',
                    marginTop: '40px'
                }}>
                    {GOAL_TYPES.map(type => (
                        <div
                            key={type.id}
                            onClick={() => handleAddGoal(type.id)}
                            style={{
                                cursor: 'pointer',
                                border: '1px solid var(--border-color)',
                                padding: '32px 24px',
                                borderRadius: '20px',
                                background: 'var(--card-bg)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: 'var(--shadow-soft)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                                e.currentTarget.style.background = 'var(--card-bg-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                                e.currentTarget.style.background = 'var(--card-bg)';
                            }}
                        >
                            <div style={{ 
                                color: 'var(--primary)', 
                                marginBottom: '8px',
                                display: 'flex', 
                                justifyContent: 'center',
                                fontSize: '32px'
                            }}>
                                {type.icon}
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '18px', textAlign: 'center', color: 'var(--text-main)' }}>{type.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>{type.description}</div>
                        </div>
                    ))}
                </div>
                <button className="btn-secondary" onClick={() => setIsAddingMode(false)}>Отмена</button>
            </div>
        );
    }

    // Dashboard View
    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 className="step-title">Ваши Цели</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginTop: '8px' }}>Сформируем ваш финансовый план</p>
            </div>

            <div className="goals-list" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {goals.map((goal, index) => {
                    const typeInfo = GOAL_TYPES.find(t => t.id === goal.goal_type_id);
                    return (
                        <div 
                            key={index} 
                            style={{
                                display: 'flex', 
                                flexDirection: 'column',
                                padding: '24px', 
                                background: 'var(--card-bg)', 
                                backdropFilter: 'blur(20px)',
                                borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-soft)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{ 
                                        color: 'var(--primary)',
                                        background: 'rgba(255, 199, 80, 0.1)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {typeInfo?.icon || <Target size={24} />}
                                    </div>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>{goal.name}</div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {goal.target_amount ? `${goal.target_amount.toLocaleString()} ₽` : goal.desired_monthly_income ? `${goal.desired_monthly_income.toLocaleString()} ₽/мес` : 'Сумма не задана'}
                                            {goal.term_months && ` • ${Math.floor(goal.term_months / 12)} лет`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleEditGoal(index)} 
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.6)', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            color: 'var(--text-main)',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGoal(index)} 
                                        style={{ 
                                            background: 'rgba(239, 68, 68, 0.1)', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            color: '#ef4444',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => setIsAddingMode(true)}
                style={{
                    width: '100%', 
                    padding: '20px', 
                    borderRadius: '16px',
                    border: '2px dashed var(--border-color)', 
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(20px)',
                    color: 'var(--text-main)', 
                    cursor: 'pointer', 
                    display: 'flex',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    marginBottom: '40px',
                    fontWeight: '600',
                    fontSize: '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-soft)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--card-bg-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                }}
            >
                <Plus size={20} /> Добавить еще цель
            </button>

            <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>Назад</button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    style={{ flex: 1 }}
                    disabled={goals.length === 0}
                >
                    Далее
                </button>
            </div>
        </div>
    );
};

export default StepGoalSelection;
