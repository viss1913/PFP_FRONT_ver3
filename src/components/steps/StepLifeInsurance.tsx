import React, { useState, useEffect } from 'react';
import type { CJMData } from '../CJMFlow';
import avatarImage from '../../assets/avatar_full.png';

interface StepLifeInsuranceProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const CAPITAL_FLOOR = 500_000;
const LIFE_CAP_CEILING = 10_000_000;
const STEP = 50_000;

const StepLifeInsurance: React.FC<StepLifeInsuranceProps> = ({ data, setData, onNext, onPrev }) => {
    const [limit, setLimit] = useState<number>(data.lifeInsuranceLimit !== undefined ? data.lifeInsuranceLimit : 0);

    /** Тот же пул, что в StepFinReserve: активы или ввод по «Сохранить и преумножить» / Рента (без подмешивания финрезерва). */
    const assetsCapital = (data.assets || []).reduce((sum, a) => sum + (a.current_value || 0), 0);
    const investmentOrRentGoalCapital = (data.goals || [])
        .filter((g) => g.goal_type_id === 3 || g.goal_type_id === 8)
        .reduce((sum, g) => sum + (g.initial_capital || 0), 0);
    const clientPoolCapital = assetsCapital > 0 ? assetsCapital : investmentOrRentGoalCapital;

    const finReserveInitial = data.initialCapital ?? 0;
    const netForLifeFormula = clientPoolCapital - finReserveInitial;
    const showLifeInsuranceUi = clientPoolCapital >= CAPITAL_FLOOR;
    const maxLifeFromFormula = Math.min(LIFE_CAP_CEILING, Math.max(0, netForLifeFormula * 15));
    /** Как раньше по ощущениям: 10% × 15 от пула, но не выше потолка по формуле. */
    const recommendedLimit = Math.min(maxLifeFromFormula, Math.round(clientPoolCapital * 0.1 * 15));

    const MIN_LIMIT = 0;
    const MAX_LIMIT = maxLifeFromFormula;

    useEffect(() => {
        setData(prev => ({
            ...prev,
            lifeInsuranceLimit: limit
        }));
    }, [limit, setData]);

    useEffect(() => {
        if (!showLifeInsuranceUi) {
            setLimit(0);
        }
    }, [showLifeInsuranceUi]);

    useEffect(() => {
        if (!showLifeInsuranceUi) return;
        if (limit > maxLifeFromFormula) {
            setLimit(maxLifeFromFormula);
        }
    }, [showLifeInsuranceUi, maxLifeFromFormula, limit]);

    useEffect(() => {
        if (!showLifeInsuranceUi) return;
        if (!data.lifeInsuranceLimit && recommendedLimit > 0) {
            setLimit(recommendedLimit);
        }
    }, [showLifeInsuranceUi, recommendedLimit, data.lifeInsuranceLimit]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' ₽';
    const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));
    const parseNumber = (val: string) => Number(val.replace(/\D/g, '')) || 0;

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
                        {!showLifeInsuranceUi
                            ? `Если капитал меньше ${formatCurrency(CAPITAL_FLOOR)}, блок Защиты Жизни не показываем — лимит 0 ₽. Можно сразу жать «Далее».`
                            : MAX_LIMIT <= 0
                                ? 'После вычета финансового резерва для страховой суммы не остаётся запаса — верхняя граница 0 ₽.'
                                : `Давайте еще создадим резерв для Защиты Жизни. Я рекомендую создать доп резерв в размере ${formatCurrency(recommendedLimit)}.`}
                    </div>
                </div>
            </div>

            {showLifeInsuranceUi && (
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

                    {MAX_LIMIT > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                className="goal-modal-range"
                                type="range"
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={STEP}
                                value={Math.min(limit, MAX_LIMIT)}
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
                                value={formatNumber(Math.min(limit, MAX_LIMIT))}
                                onChange={(e) => {
                                    const val = parseNumber(e.target.value);
                                    setLimit(Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, val)));
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
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5, marginBottom: '16px' }}>
                            Максимум по формуле — 0 ₽ (капитал после резерва не даёт запас ×15 в пределах 10 млн).
                        </p>
                    )}

                    <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Текущий выбор: <span style={{ color: '#334155', fontWeight: 'bold' }}>{formatCurrency(Math.min(limit, MAX_LIMIT))}</span>
                    </div>
                </div>
            </div>
            )}

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
