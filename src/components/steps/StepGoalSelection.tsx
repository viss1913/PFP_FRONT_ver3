

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

    // Helper to format currency
    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header Section: Avatar + Title */}
            <div className="goal-step-wrapper">
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '40px',
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

                {/* Selected Goals (Moved to TOP as requested) */}
                {goals.length > 0 && (
                    <div style={{
                        marginBottom: '32px',
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

                {/* If no goals selected, show Back button here (since it's not in the top bar) */}
                {goals.length === 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            className="btn-text"
                            onClick={onPrev}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}
                        >
                            <ChevronLeft size={16} /> Назад
                        </button>
                    </div>
                )}
            </div>

            {/* Main Grid: Responsive CSS Grid */}
            <div className="cards-container">
                {GOAL_GALLERY_ITEMS.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            height: '195px', // Fixed height
                            backgroundColor: '#fff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}>

                        {/* Background Image (Full Cover) */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                        }}>
                            <img
                                src={item.image}
                                alt={item.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center right' }}
                            />
                        </div>

                        {/* Yellow Overlay with Diagonal Cut */}
                        <div style={{
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0,
                            width: '55%',
                            background: '#FFC845',
                            clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)', // Slant
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '24px', // Increased padding for bigger card
                        }}>
                            <div style={{
                                fontWeight: '700',
                                fontSize: '18px', // Increased font for bigger card
                                color: '#1F2937',
                                lineHeight: '1.2',
                                width: '90%'
                            }}>
                                {item.title}
                            </div>
                        </div>
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
                        maxWidth: '500px',
                        padding: '40px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'scaleIn 0.2s ease-out'
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
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'baseline' }}>
                                <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Стоимость цели</label>
                                <span style={{ fontWeight: '800', fontSize: '20px', color: '#E91E63' }}>{formatCurrency(targetAmount)}</span>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'baseline' }}>
                                <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Срок (лет)</label>
                                <span style={{ fontWeight: '800', fontSize: '20px', color: '#E91E63' }}>{Math.floor(termMonths / 12)} лет</span>
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

