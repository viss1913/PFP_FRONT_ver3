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
    { id: 1, name: 'Финансовая подушка', icon: <Shield size={24} />, description: 'На случай чп' },
    { id: 2, name: 'Пассивный доход', icon: <Leaf size={24} />, description: 'Жить на проценты' },
    { id: 3, name: 'Крупная покупка', icon: <Target size={24} />, description: 'Авто, дача и т.д.' }, // Generic Investment/Purchase
    { id: 4, name: 'Недвижимость', icon: <Home size={24} />, description: 'Квартира, дом' },
    { id: 6, name: 'Образование', icon: <GraduationCap size={24} />, description: 'Детям или себе' },
    { id: 7, name: 'Пенсия', icon: <Leaf size={24} />, description: 'На старость' },
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
        const newGoal: ClientGoal = {
            goal_type_id: typeId,
            name: typeInfo?.name || 'Новая цель',
            target_amount: isRent ? undefined : 0,
            term_months: isRent ? undefined : 120, // 10 years default
            risk_profile: data.riskProfile || 'BALANCED',
            initial_capital: isRent ? 0 : undefined // For RENT, set initial_capital
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                    {GOAL_TYPES.map(type => (
                        <div
                            key={type.id}
                            className={`goal-card`}
                            onClick={() => handleAddGoal(type.id)}
                            style={{
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'var(--card-bg)'
                            }}
                        >
                            <div style={{ color: 'var(--primary)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                {type.icon}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{type.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{type.description}</div>
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
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 className="step-title">Ваши Цели</h2>
                <p style={{ color: 'var(--text-muted)' }}>Сформируем ваш финансовый план</p>
            </div>

            <div className="goals-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {goals.map((goal, index) => {
                    const typeInfo = GOAL_TYPES.find(t => t.id === goal.goal_type_id);
                    return (
                        <div key={index} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px', background: 'var(--card-bg)', borderRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ color: 'var(--primary)' }}>
                                    {typeInfo?.icon || <Target size={24} />}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>{goal.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {goal.target_amount ? `${goal.target_amount.toLocaleString()} ₽` : 'Сумма не задана'} • {Math.floor((goal.term_months || 0) / 12)} лет
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEditGoal(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDeleteGoal(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => setIsAddingMode(true)}
                style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    border: '2px dashed rgba(255,255,255,0.2)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '30px'
                }}
            >
                <Plus size={18} /> Добавить еще цель
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
