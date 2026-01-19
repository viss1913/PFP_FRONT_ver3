import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import type { CJMData } from '../CJMFlow';

interface StepLifeInsuranceProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepLifeInsurance: React.FC<StepLifeInsuranceProps> = ({ data, setData, onNext, onPrev }) => {
    // Initialize with existing value if defined, otherwise default to 0 (or a suggested starting value like 1M?)
    // User requested ability to set 0. And minimum 500k.
    // If we want to suggest insurance, maybe default to 0 and let them scroll? Or 1M?
    // Let's rely on data if present. Default to 0 if not.
    const [limit, setLimit] = useState<number>(data.lifeInsuranceLimit !== undefined ? data.lifeInsuranceLimit : 0);

    useEffect(() => {
        setData(prev => ({
            ...prev,
            lifeInsuranceLimit: limit
        }));
    }, [limit, setData]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' ₽';

    const MIN_LIMIT = 0;
    const MAX_LIMIT = 10000000;
    const STEP = 500000;

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <Heart size={32} color="#000" />
                </div>
                <h2 className="step-title">Защита Жизни</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '18px' }}>
                    Выберите лимит страхования жизни (НСЖ)
                </p>
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
                                type="range"
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={STEP}
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <span>0 ₽</span>
                                <span>5 млн ₽</span>
                                <span>10 млн ₽</span>
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--input-bg)',
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
                                type="number"
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={STEP}
                                value={limit}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setLimit(val);
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
                        Текущий выбор: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatCurrency(limit)}</span>
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
