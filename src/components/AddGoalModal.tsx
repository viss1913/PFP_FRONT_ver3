import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { GOAL_GALLERY_ITEMS } from '../utils/GoalImages';
import { formatMonthsToDate } from '../utils/dateUtils';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (goal: any) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedType, setSelectedType] = useState<typeof GOAL_GALLERY_ITEMS[0] | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        target_amount: 3000000,
        term_months: 60,
        initial_capital: 0,
        desired_monthly_income: 100000,
        inflation_rate: 5.6,
        monthly_replenishment: 0,
        risk_profile: 'BALANCED'
    });

    if (!isOpen) return null;

    const handleSelectType = (type: typeof GOAL_GALLERY_ITEMS[0]) => {
        setSelectedType(type);
        setStep(2);
        // Set defaults based on type
        if (type.typeId === 1 || type.typeId === 2) {
            setFormData(prev => ({ ...prev, desired_monthly_income: 100000, term_months: type.typeId === 1 ? 0 : 120 }));
        } else if (type.typeId === 8) { // RENT
            setFormData(prev => ({ ...prev, initial_capital: 1000000, monthly_replenishment: 0 }));
        } else if (type.typeId === 7) { // FIN_RESERVE
            setFormData(prev => ({ ...prev, initial_capital: 200000, monthly_replenishment: 10000, term_months: 12 }));
        } else {
            setFormData(prev => ({ ...prev, target_amount: 3000000, term_months: 60 }));
        }
    };

    const handleSubmit = () => {
        if (!selectedType) return;

        const goalPayload = {
            goal_type_id: selectedType.typeId,
            name: selectedType.title,
            ...formData
        };

        onAdd(goalPayload);
        onClose();
        // Reset
        setStep(1);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '32px',
                width: '100%',
                maxWidth: step === 1 ? '900px' : '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                padding: '40px'
            }}>
                <button onClick={() => { onClose(); setStep(1); setSelectedType(null); }} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={20} />
                </button>

                {step === 1 ? (
                    <>
                        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '32px', color: '#111' }}>Выберите тип цели</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {GOAL_GALLERY_ITEMS.map(item => (
                                <div key={item.id} onClick={() => handleSelectType(item)} style={{ cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', border: '1px solid #eee', transition: 'all 0.2s', background: '#fff' }} className="goal-type-card">
                                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                    <div style={{ padding: '20px', fontWeight: '700', fontSize: '18px', color: '#333' }}>{item.title}</div>
                                    <style>{`
                    .goal-type-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: #C2185B; }
                  `}</style>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
                            <ChevronLeft size={16} /> Назад к выбору типа
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                            <img src={selectedType?.image} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} alt="" />
                            <div>
                                <div style={{ fontSize: '12px', color: '#C2185B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Параметры цели</div>
                                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#111' }}>{selectedType?.title}</h2>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            {/* Type specific fields */}
                            {(selectedType?.typeId === 1 || selectedType?.typeId === 2) && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Желаемый доход (₽/мес)</label>
                                    <input type="number" value={formData.desired_monthly_income} onChange={e => setFormData({ ...formData, desired_monthly_income: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                </div>
                            )}

                            {(selectedType?.typeId === 2 || selectedType?.typeId === 3 || selectedType?.typeId === 4 || selectedType?.typeId === 5 || selectedType?.typeId === 7) && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Срок (мес)</label>
                                    <input type="number" value={formData.term_months} onChange={e => setFormData({ ...formData, term_months: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                    <div style={{ marginTop: '6px', fontSize: '14px', color: '#C2185B', fontWeight: '600' }}>≈ {formatMonthsToDate(formData.term_months)}</div>
                                </div>
                            )}

                            {(selectedType?.typeId === 3 || selectedType?.typeId === 7 || selectedType?.typeId === 8) && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Первоначальный капитал (₽)</label>
                                    <input type="number" value={formData.initial_capital} onChange={e => setFormData({ ...formData, initial_capital: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                </div>
                            )}

                            {(selectedType?.typeId === 3 || selectedType?.typeId === 7) && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Ежемесячное пополнение (₽)</label>
                                    <input type="number" value={formData.monthly_replenishment} onChange={e => setFormData({ ...formData, monthly_replenishment: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                </div>
                            )}

                            {selectedType?.typeId === 4 && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Стоимость сегодня (₽)</label>
                                    <input type="number" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                </div>
                            )}

                            {selectedType?.typeId === 5 && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: '#444' }}>Страховая сумма (₽)</label>
                                    <input type="number" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: +e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #eee', fontSize: '16px', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = '#C2185B'} onBlur={e => e.currentTarget.style.borderColor = '#eee'} />
                                </div>
                            )}

                            <button onClick={handleSubmit} style={{ marginTop: '16px', background: 'linear-gradient(135deg, #C2185B 0%, #E91E63 100%)', color: '#fff', border: 'none', padding: '20px', borderRadius: '100px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(194, 24, 91, 0.3)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                Создать цель
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddGoalModal;
