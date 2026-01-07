

import React, { useState } from 'react';
import { X, ArrowRight, User, ChevronLeft } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import type { ClientGoal } from '../../types/client';
import { GOAL_GALLERY_ITEMS } from '../../utils/GoalImages';

interface StepGoalSelectionProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepGoalSelection: React.FC<StepGoalSelectionProps> = ({ data, setData, onNext, onPrev }) => {


    const goals = data.goals || [];

    // State for the "Add Goal" Modal
    // Default constants
    const DEFAULT_TARGET_AMOUNT = 3000000;
    const DEFAULT_TERM_YEARS = 5;

    // State for modal
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<typeof GOAL_GALLERY_ITEMS[0] | null>(null);
    const [targetAmount, setTargetAmount] = useState<number>(DEFAULT_TARGET_AMOUNT);
    const [termMonths, setTermMonths] = useState<number>(DEFAULT_TERM_YEARS * 12);

    // Handle clicking a card in the gallery
    const handleCardClick = (item: typeof GOAL_GALLERY_ITEMS[0]) => {
        setSelectedGalleryItem(item);
        // Reset defaults when opening new goal
        setTargetAmount(DEFAULT_TARGET_AMOUNT);
        setTermMonths(DEFAULT_TERM_YEARS * 12);
    };

    const handleAddGoal = () => {
        if (!selectedGalleryItem) return;

        const newGoal: ClientGoal = {
            goal_type_id: selectedGalleryItem.typeId, // Use selectedGalleryItem.typeId directly
            name: selectedGalleryItem.title,
            target_amount: targetAmount,
            term_months: termMonths,
            risk_profile: data.riskProfile || 'BALANCED',
            initial_capital: 0,
            monthly_replenishment: 0,
            // Default 100k for Pension/Passive
            desired_monthly_income: (selectedGalleryItem.typeId === 1 || selectedGalleryItem.typeId === 2) ? 100000 : 0,
            // Initial inflation based on default term (5 years -> 60 months)
            inflation_rate: 5.6
        };

        // Add to list
        setData(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));

        // Close modal
        setSelectedGalleryItem(null);
    };

    const removeGoal = (index: number) => {
        const newGoals = [...goals];
        newGoals.splice(index, 1);
        setData(prev => ({ ...prev, goals: newGoals }));
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

    return (
        <div style={{ paddingBottom: '40px' }}>

            <div className="goalsContainer">
                {/* Header Section: Spanning full width */}
                <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '40px'
                    }}>
                        {/* Left: Avatar & Intro */}
                        <div style={{ flex: '0 0 300px' }}>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '50%', background: '#F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={24} color="#374151" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Ваш AI Ассистент</h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Финансовый советник</p>
                                </div>
                            </div>
                            <div style={{
                                background: '#fff',
                                borderRadius: '16px', // Rounded bubble
                                borderTopLeftRadius: '4px',
                                padding: '24px',
                                fontSize: '15px',
                                lineHeight: '1.6',
                                color: '#374151',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                position: 'relative'
                            }}>
                                Привет! 👋 <br />
                                Давай определим твои финансовые цели. Выбери из списка то, что для тебя важно.
                            </div>
                        </div>

                        {/* Right: Title & Context */}
                        <div style={{ flex: 1, paddingTop: '10px' }}>
                            <h2 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 24px 0', lineHeight: 1.1 }}>
                                Чего вы <br />хотите достичь?
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Selected Goals (Basket): Spanning full width */}
                {goals.length > 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        marginBottom: '12px',
                        padding: '24px',
                        background: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Выбранные цели ({goals.length})</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={onPrev}
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={onNext}
                                    style={{ padding: '0 24px', height: '40px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    Далее <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {goals.map((g, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px 16px',
                                    background: '#F3F4F6',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    <span>{g.name}</span>
                                    <span style={{ color: '#6B7280', fontWeight: '400' }}>| {formatCurrency(g.target_amount || 0)}</span>
                                    <button
                                        onClick={() => removeGoal(idx)}
                                        style={{
                                            border: 'none', background: 'rgba(0,0,0,0.05)',
                                            borderRadius: '50%', width: '20px', height: '20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', marginLeft: '4px'
                                        }}
                                    >
                                        <X size={12} color="#6B7280" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back Button (if no basket): Spanning full width */}
                {goals.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
                        <button
                            className="btn-text"
                            onClick={onPrev}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}
                        >
                            <ChevronLeft size={16} /> Назад
                        </button>
                    </div>
                )}

                {/* Main Grid Items */}
                {GOAL_GALLERY_ITEMS.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className="goalCard"
                    >
                        <div className="goalCard__title">
                            {item.title}
                        </div>
                        <img
                            src={item.image}
                            alt={item.title}
                            className="goalCard__image"
                        />
                    </div>
                ))}
            </div>

            {/* Modal / Overlay for Adding Goal - FIXED POSITIONING */}
            {selectedGalleryItem && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, // Ensure it's on top
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center', // Vertically center
                    justifyContent: 'center', // Horizontally center
                    padding: '24px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '32px',
                        width: '100%',
                        maxWidth: '600px',
                        padding: '40px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'scaleIn 0.2s ease-out',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <style>{`
                            @keyframes scaleIn {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>

                        <button
                            onClick={() => setSelectedGalleryItem(null)}
                            style={{
                                position: 'absolute', top: '24px', right: '24px',
                                border: 'none', background: '#F3F4F6',
                                borderRadius: '50%', width: '40px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
                        >
                            <X size={20} color="#374151" />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <img src={selectedGalleryItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Новая цель</div>
                                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, lineHeight: 1.1 }}>{selectedGalleryItem.title}</h2>
                            </div>
                        </div>

                        {/* Sliders */}
                        {/* Sliders */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Стоимость цели</label>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                                    style={{
                                        fontWeight: '800',
                                        fontSize: '20px',
                                        color: '#E91E63',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        width: '180px',
                                        textAlign: 'right'
                                    }}
                                />
                            </div>
                            <input
                                type="range"
                                min="100000" max="50000000" step="100000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(Number(e.target.value))}
                                style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Срок (лет)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={Math.floor(termMonths / 12)}
                                        onChange={(e) => setTermMonths(Number(e.target.value) * 12)}
                                        style={{
                                            fontWeight: '800',
                                            fontSize: '20px',
                                            color: '#E91E63',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            padding: '4px 8px',
                                            width: '80px',
                                            textAlign: 'right'
                                        }}
                                    />
                                    <span style={{ fontWeight: '800', fontSize: '20px', color: '#E91E63' }}>лет</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1" max="50" step="1"
                                value={termMonths / 12}
                                onChange={(e) => setTermMonths(Number(e.target.value) * 12)}
                                style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                            />
                            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px', textAlign: 'right' }}>
                                {termMonths} месяцев
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleAddGoal}
                            style={{ width: '100%', padding: '20px', borderRadius: '20px', fontSize: '18px', fontWeight: '700', boxShadow: '0 10px 20px -5px rgba(233, 30, 99, 0.4)' }}
                        >
                            Добавить цель
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepGoalSelection;

