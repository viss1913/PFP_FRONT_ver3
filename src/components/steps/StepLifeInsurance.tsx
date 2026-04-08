import React, { useState, useEffect } from 'react';
import type { CJMData } from '../CJMFlow';
import avatarImage from '../../assets/avatar_full.png';

interface StepLifeInsuranceProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepLifeInsurance: React.FC<StepLifeInsuranceProps> = ({ data, setData, onNext, onPrev }) => {
    const [limit, setLimit] = useState<number>(data.lifeInsuranceLimit !== undefined ? data.lifeInsuranceLimit : 0);
    const assetsCapital = (data.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);
    const investmentOrRentGoalCapital = (data.goals || [])
        .filter((g) => g.goal_type_id === 3 || g.goal_type_id === 8)
        .reduce((sum, g) => sum + (g.initial_capital || 0), 0);
    const sourceCapital = assetsCapital > 0 ? assetsCapital : Math.max(investmentOrRentGoalCapital, data.initialCapital || 0);
    const shouldShowRecommendation = sourceCapital >= 500000;
    const recommendedLimit = Math.round(sourceCapital * 0.1 * 15);

    useEffect(() => {
        setData(prev => ({
            ...prev,
            lifeInsuranceLimit: limit
        }));
    }, [limit, setData]);

    useEffect(() => {
        if (shouldShowRecommendation && (!data.lifeInsuranceLimit || data.lifeInsuranceLimit === 0)) {
            setLimit(recommendedLimit);
        }
    }, [shouldShowRecommendation, recommendedLimit, data.lifeInsuranceLimit]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' ₽';
    const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));
    const parseNumber = (val: string) => Number(val.replace(/\D/g, '')) || 0;

    const MIN_LIMIT = 0;
    const MAX_LIMIT = Math.max(10000000, recommendedLimit || 0);
    const STEP = 50000;

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '32px'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        minWidth: '120px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        background: '#fff'
                    }}>
                        <img src={avatarImage} alt="AI Assistant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{
                        background: '#fff',
                        borderRadius: '24px',
                        borderTopLeftRadius: '4px',
                        padding: '28px',
                        fontSize: '18px',
                        lineHeight: '1.5',
                        color: '#1F2937',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        maxWidth: '620px',
                        fontWeight: '500'
                    }}>
                        {shouldShowRecommendation
                            ? `Давайте еще создадим резерв для Защиты Жизни. Я рекомендую создать доп резерв в размере ${formatCurrency(recommendedLimit)}.`
                            : 'Для текущего капитала дополнительный резерв Защиты Жизни можно не создавать.'}
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                padding: '32px',
                marginBottom: '40px'
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>
                        Страховая сумма по риску "Уход из жизни"
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                className="goal-modal-range"
                                type="range"
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={STEP}
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <span>0 ₽</span>
                                <span>{formatCurrency(Math.round(MAX_LIMIT / 2))}</span>
                                <span>{formatCurrency(MAX_LIMIT)}</span>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.88)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            minWidth: '180px',
                            textAlign: 'right',
                            fontSize: '20px',
                            fontWeight: '700',
                            color: 'var(--text-main)'
                        }}>
                            <input
                                type="text"
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={STEP}
                                value={formatNumber(limit)}
                                onChange={(e) => {
                                    const val = parseNumber(e.target.value);
                                    setLimit(Math.min(MAX_LIMIT, val));
                                }}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'right',
                                    width: '100%',
                                    fontSize: 'inherit',
                                    fontWeight: 'inherit',
                                    color: 'inherit',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Текущий выбор: <span style={{ color: '#334155', fontWeight: 'bold' }}>{formatCurrency(limit)}</span>
                    </div>
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

export default StepLifeInsurance;
