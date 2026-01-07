

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
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<typeof GOAL_GALLERY_ITEMS[0] | null>(null);
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [termMonths, setTermMonths] = useState<number>(120); // Default 10 years

    // Handle clicking a card in the gallery
    const handleCardClick = (item: typeof GOAL_GALLERY_ITEMS[0]) => {
        setSelectedGalleryItem(item);
        // Reset defaults based on type
        if (item.typeId === 1 || item.typeId === 2 || item.typeId === 8) {
            // Pension / Passive Income / Rent
            // These might need different logic (monthly income vs target amount)
            // For MVP simplifiction, let's stick to Target Amount logic for all, 
            // OR adapt the modal if it's passive income.
            // As per instructions, "Passive Income" usually needs "Desired Monthly Income".
            // But let's start with a generic "Target Amount" slider for visually consistent UI first.
            setTargetAmount(10000000);
            setTermMonths(120);
        } else {
            setTargetAmount(5000000);
            setTermMonths(60);
        }
    };

    const handleAddGoal = () => {
        if (!selectedGalleryItem) return;

        const newGoal: ClientGoal = {
            goal_type_id: selectedGalleryItem.typeId,
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
        <div style={{ display: 'flex', gap: '40px', minHeight: '600px' }}>
            {/* Sidebar with Avatar */}
            <aside style={{
                width: '300px',
                background: '#fff',
                borderRadius: '24px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
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
                        background: '#F9FAFB',
                        padding: '16px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: '#374151'
                    }}>
                        Привет! 👋 <br /><br />
                        Давай определим твои финансовые цели. Выбери из списка то, что для тебя важно.<br /><br />
                        Я помогу рассчитать, сколько нужно откладывать, чтобы достичь их.
                    </div>
                </div>

                {/* Selected Goals Summary (Mini Basket) */}
                <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '16px' }}>
                        Выбранные цели ({goals.length})
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {goals.length === 0 && <div style={{ fontSize: '13px', color: '#D1D5DB' }}>Пока ничего не выбрано</div>}

                        {goals.map((g, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: '#F3F4F6', borderRadius: '12px', fontSize: '13px'
                            }}>
                                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                    {g.name}
                                </div>
                                <button onClick={() => removeGoal(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                                    <X size={14} color="#9CA3AF" />
                                </button>
                            </div>
                        ))}
                    </div>


                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            className="btn-secondary"
                            onClick={onPrev}
                            style={{
                                width: '48px', height: '48px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 0
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="btn-primary"
                            onClick={onNext}
                            disabled={goals.length === 0}
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            Далее <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Grid */}
            <main style={{ flex: 1 }}>
                <h2 className="step-title" style={{ marginBottom: '32px' }}>Чего вы хотите достичь?</h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '24px',
                    paddingBottom: '40px'
                }}>
                    {GOAL_GALLERY_ITEMS.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleCardClick(item)}
                            style={{
                                borderRadius: '20px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                height: '160px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Overlay is baked into image design mostly, but let's assume we need no text overlay if image has text. 
                                The Figma images HAVE text. So we don't overlay HTML text. */}
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal / Overlay for Adding Goal */}
            {selectedGalleryItem && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '24px',
                        width: '500px',
                        maxWidth: '90%',
                        padding: '32px',
                        position: 'relative',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <button
                            onClick={() => setSelectedGalleryItem(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#9CA3AF" />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden' }}>
                                <img src={selectedGalleryItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Новая цель</div>
                                <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{selectedGalleryItem.title}</h2>
                            </div>
                        </div>

                        {/* Sliders */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '500' }}>Стоимость цели</label>
                                <span style={{ fontWeight: '700', color: '#E91E63' }}>{formatCurrency(targetAmount)}</span>
                            </div>
                            <input
                                type="range"
                                min="100000" max="100000000" step="100000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#E91E63' }}
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '500' }}>Срок (лет)</label>
                                <span style={{ fontWeight: '700', color: '#E91E63' }}>{Math.floor(termMonths / 12)} лет</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="50" step="1"
                                value={termMonths / 12}
                                onChange={(e) => setTermMonths(Number(e.target.value) * 12)}
                                style={{ width: '100%', accentColor: '#E91E63' }}
                            />
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                                {termMonths} месяцев
                            </div>
                        </div>

                        <button
                            className="btn-primary" // Assuming global CSS for this class exists from previous components
                            onClick={handleAddGoal}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600' }}
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
