

import React, { useState } from 'react';
import { X, ArrowRight, ChevronLeft } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import type { ClientGoal } from '../../types/client';
import { GOAL_GALLERY_ITEMS } from '../../utils/GoalImages';
import avatarImage from '../../assets/avatar_full.png';

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
    const DEFAULT_DESIRED_INCOME = 100000;
    const DEFAULT_INITIAL_CAPITAL = 5000000;

    // State for modal
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<typeof GOAL_GALLERY_ITEMS[0] | null>(null);
    const [targetAmount, setTargetAmount] = useState<number>(DEFAULT_TARGET_AMOUNT);
    const [termMonths, setTermMonths] = useState<number>(DEFAULT_TERM_YEARS * 12);
    const [desiredIncome, setDesiredIncome] = useState<number>(DEFAULT_DESIRED_INCOME);
    const [initialCapital, setInitialCapital] = useState<number>(DEFAULT_INITIAL_CAPITAL);
    // monthlyReplenishment state removed/unused for inputs now, but needed if we want to support it for other goals later. 
    // For now, it's always 0 for new goals via this modal.

    // Handle clicking a card in the gallery
    const handleCardClick = (item: typeof GOAL_GALLERY_ITEMS[0]) => {
        setSelectedGalleryItem(item);
        // Reset defaults when opening new goal
        setTargetAmount(DEFAULT_TARGET_AMOUNT);
        setTermMonths(DEFAULT_TERM_YEARS * 12);

        if (item.typeId === 7) { // Ликвидный резерв (RESERVE)
            setDesiredIncome(10000); // По умолчанию 10к пополнение
            setInitialCapital(0);
        } else {
            setDesiredIncome(DEFAULT_DESIRED_INCOME);
            setInitialCapital(DEFAULT_INITIAL_CAPITAL);
        }
    };

    const handleAddGoal = () => {
        if (!selectedGalleryItem) return;

        const typeId = selectedGalleryItem.typeId;
        const newGoal: ClientGoal = {
            goal_type_id: typeId,
            name: selectedGalleryItem.title,
            initial_capital: 0,
            monthly_replenishment: 0,
            target_amount: 0,
            term_months: termMonths,
            desired_monthly_income: 0,
            inflation_rate: 5.6 // Default
        };

        // Map fields based on Type
        if (typeId === 1) { // 1. ГосПенсия (PENSION)
            newGoal.desired_monthly_income = desiredIncome;
            newGoal.term_months = 0;
        } else if (typeId === 2) { // 2. Пассивный доход (PASSIVE_INCOME)
            newGoal.desired_monthly_income = desiredIncome;
            newGoal.term_months = termMonths;
            newGoal.inflation_rate = 4.8;
        } else if (typeId === 8 || typeId === 3 || typeId === 7) { // 3. Рента (RENT), Сохранить и приумножить (INVESTMENT) или Ликвидный резерв (RESERVE)
            newGoal.initial_capital = initialCapital;
            newGoal.monthly_replenishment = (typeId === 3 || typeId === 7) ? desiredIncome : 0; // Для ID 3 и 7 используем поле desiredIncome как поле пополнения
            newGoal.name = selectedGalleryItem.title;
            newGoal.inflation_rate = (typeId === 3) ? 5.6 : 0;
            newGoal.term_months = (typeId === 3) ? termMonths : 0;
            if (typeId === 7) newGoal.term_months = 0; // Резерв обычно бессрочный
        } else {
            // 4. Standard
            newGoal.target_amount = targetAmount;
            newGoal.term_months = termMonths;

            // Inflation Rule
            const years = termMonths / 12;
            if (years < 3) newGoal.inflation_rate = 6.8;
            else if (years < 5) newGoal.inflation_rate = 6;
            else if (years < 10) newGoal.inflation_rate = 5.6;
            else newGoal.inflation_rate = 4.8;
        }

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

    const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(val);
    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val).replace('₽', 'р.');

    // Helper to handle input changes with formatting
    const handleNumberInput = (val: string, setter: (n: number) => void) => {
        const numeric = val.replace(/\D/g, '');
        setter(Number(numeric));
    };

    // Render Helpers
    const isPension = selectedGalleryItem?.typeId === 1;
    const isPassive = selectedGalleryItem?.typeId === 2;
    const isRent = selectedGalleryItem?.typeId === 8;
    const isInvest = selectedGalleryItem?.typeId === 3;
    const isReserve = selectedGalleryItem?.typeId === 7;
    const isStandard = !isPension && !isPassive && !isRent && !isInvest && !isReserve;

    const totalAssetsSum = (data.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);

    return (
        <div style={{ paddingBottom: '40px' }}>

            <div className="goalsContainer">
                {/* Header Section: Spanning full width */}
                <div style={{ gridColumn: '1 / -1', marginBottom: '40px' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '32px'
                    }}>
                        {/* Avatar Image */}
                        <div style={{
                            width: '120px',
                            height: '120px',
                            minWidth: '120px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            background: '#fff'
                        }}>
                            <img
                                src={avatarImage}
                                alt="AI Assistant"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Speech Bubble */}
                        <div style={{
                            background: '#fff',
                            borderRadius: '24px',
                            borderTopLeftRadius: '4px',
                            padding: '32px',
                            fontSize: '18px',
                            lineHeight: '1.5',
                            color: '#1F2937',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            maxWidth: '600px',
                            fontWeight: '500'
                        }}>
                            Выберите вашу первую цель. Я бы порекомендовала начать с создания пассивного дохода в будущем. Потом сможете добавить любую другую.
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
                                    <span style={{ color: '#6B7280', fontWeight: '400' }}>| {formatCurrency(
                                        (g.goal_type_id === 1 || g.goal_type_id === 2) ? (g.desired_monthly_income || 0) :
                                            (g.goal_type_id === 8) ? (g.initial_capital || 0) :
                                                (g.target_amount || 0)
                                    )}</span>
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
                        maxHeight: '85vh',
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <img src={selectedGalleryItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Новая цель</div>
                                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, lineHeight: 1.1 }}>{selectedGalleryItem.title}</h2>
                            </div>
                        </div>

                        {/* DYNAMIC FORMS BASED ON TYPE */}

                        {/* 1. Standard Targets (Amount & Term) */}
                        {isStandard && (
                            <>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Стоимость цели</label>
                                        <input
                                            type="text"
                                            value={formatNumber(targetAmount)}
                                            onChange={(e) => handleNumberInput(e.target.value, setTargetAmount)}
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
                                                type="text"
                                                value={formatNumber(Math.floor(termMonths / 12))}
                                                onChange={(e) => handleNumberInput(e.target.value, (n) => setTermMonths(n * 12))}
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
                            </>
                        )}

                        {/* 2. Pension & Passive Income (Desired Income) */}
                        {(isPension || isPassive) && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                    <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Желаемый ежемесячный доход</label>
                                    <input
                                        type="text"
                                        value={formatNumber(desiredIncome)}
                                        onChange={(e) => handleNumberInput(e.target.value, setDesiredIncome)}
                                        style={{
                                            fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                            border: '1px solid #E5E7EB', borderRadius: '8px',
                                            padding: '4px 8px', width: '180px', textAlign: 'right'
                                        }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="10000" max="1000000" step="5000"
                                    value={desiredIncome}
                                    onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                    style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                />
                                {isPassive && (
                                    <div style={{ marginTop: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Срок накопления (лет)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={formatNumber(Math.floor(termMonths / 12))}
                                                    onChange={(e) => handleNumberInput(e.target.value, (n) => setTermMonths(n * 12))}
                                                    style={{
                                                        fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                        border: '1px solid #E5E7EB', borderRadius: '8px',
                                                        padding: '4px 8px', width: '80px', textAlign: 'right'
                                                    }}
                                                />
                                                <span style={{ fontWeight: '800', fontSize: '20px', color: '#E91E63' }}>лет</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="30" step="1"
                                            value={termMonths / 12}
                                            onChange={(e) => setTermMonths(Number(e.target.value) * 12)}
                                            style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Invest "Save and Multiply" */}
                        {isInvest && (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Первоначальный капитал</label>
                                        <input
                                            type="text"
                                            value={formatNumber(initialCapital)}
                                            onChange={(e) => handleNumberInput(e.target.value, setInitialCapital)}
                                            style={{
                                                fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                border: '1px solid #E5E7EB', borderRadius: '8px',
                                                padding: '4px 8px', width: '180px', textAlign: 'right'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="10000000" step="100000"
                                        value={initialCapital}
                                        onChange={(e) => setInitialCapital(Number(e.target.value))}
                                        style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Ежемесячное пополнение</label>
                                        <input
                                            type="text"
                                            value={formatNumber(desiredIncome)}
                                            onChange={(e) => handleNumberInput(e.target.value, setDesiredIncome)}
                                            style={{
                                                fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                border: '1px solid #E5E7EB', borderRadius: '8px',
                                                padding: '4px 8px', width: '180px', textAlign: 'right'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="500000" step="5000"
                                        value={desiredIncome}
                                        onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                        style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Срок (лет)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={formatNumber(Math.floor(termMonths / 12))}
                                                onChange={(e) => handleNumberInput(e.target.value, (n) => setTermMonths(n * 12))}
                                                style={{
                                                    fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                    border: '1px solid #E5E7EB', borderRadius: '8px',
                                                    padding: '4px 8px', width: '80px', textAlign: 'right'
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
                                </div>
                            </>
                        )}

                        {/* 5. Liquid Reserve (Freserve) */}
                        {isReserve && (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Первоначальный капитал</label>
                                        <input
                                            type="text"
                                            value={formatNumber(initialCapital)}
                                            onChange={(e) => handleNumberInput(e.target.value, setInitialCapital)}
                                            style={{
                                                fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                border: '1px solid #E5E7EB', borderRadius: '8px',
                                                padding: '4px 8px', width: '180px', textAlign: 'right'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max={totalAssetsSum || 10000000} step={Math.max(1000, Math.floor((totalAssetsSum || 10000000) / 100))}
                                        value={initialCapital}
                                        onChange={(e) => setInitialCapital(Number(e.target.value))}
                                        style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Доступно из активов: {formatCurrency(totalAssetsSum)}</div>
                                </div>
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Ежемесячное пополнение</label>
                                        <input
                                            type="text"
                                            value={formatNumber(desiredIncome)}
                                            onChange={(e) => handleNumberInput(e.target.value, setDesiredIncome)}
                                            style={{
                                                fontWeight: '800', fontSize: '20px', color: '#E91E63',
                                                border: '1px solid #E5E7EB', borderRadius: '8px',
                                                padding: '4px 8px', width: '180px', textAlign: 'right'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="200000" step="5000"
                                        value={desiredIncome}
                                        onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                        style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                    />
                                </div>
                            </>
                        )}

                        {/* 3. Rent (Capital ONLY) - Corrected */}
                        {isRent && (
                            <>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <label style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>Капитал</label>
                                        <input
                                            type="text"
                                            value={formatNumber(initialCapital)}
                                            onChange={(e) => handleNumberInput(e.target.value, setInitialCapital)}
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
                                        min="1000000" max="100000000" step="500000"
                                        value={initialCapital}
                                        onChange={(e) => setInitialCapital(Number(e.target.value))}
                                        style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', accentColor: '#E91E63', cursor: 'pointer' }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Сумма, с которой вы планируете получать ренту</div>
                                </div>
                                {/* Removed Monthly Replenishment Input for Rent */}
                            </>
                        )}

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

