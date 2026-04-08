import React, { useState, useEffect } from 'react';
import type { CJMData } from '../CJMFlow';
import type { Asset } from '../../types/client';
import avatarImage from '../../assets/avatar_full.png';

interface StepAssetsProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const StepAssets: React.FC<StepAssetsProps> = ({ data, setData, onNext, onPrev }) => {
    // Initialize with existing cash value or 0
    const [value, setValue] = useState<number>(0);

    // Sync local state with data on mount
    useEffect(() => {
        const existingCash = data.assets?.find(a => a.type === 'CASH')?.current_value || 0;
        setValue(existingCash);
    }, []); // Run once on mount to get initial value from data

    const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numValue = Number(rawValue);

        setValue(numValue);

        // Update global state immediately
        // We replace the entire assets array with a single CASH asset as requested
        const newAsset: Asset = {
            type: 'CASH',
            name: 'Наличные',
            current_value: numValue,
            currency: 'RUB'
        };

        setData(prev => ({
            ...prev,
            assets: [newAsset]
        }));
    };

    return (
        <div>
            {/* Header with Avatar */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                marginBottom: '40px'
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
                    Отлично. с целями понятно. А какой у вас сейчас текущий капитал уже есть?
                </div>
            </div>

            <div style={{
                padding: '32px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.9) 100%)',
                backdropFilter: 'blur(16px) saturate(125%)',
                WebkitBackdropFilter: 'blur(16px) saturate(125%)',
                borderRadius: '24px',
                marginBottom: '32px',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                boxShadow: '0 16px 30px rgba(71, 85, 105, 0.12), inset 0 1px 0 rgba(255,255,255,0.85)',
                maxWidth: '500px',
                margin: '0 auto 32px auto' // Center the card
            }}>
                <div className="input-group">
                    <label className="label" style={{ display: 'block', marginBottom: '14px', fontSize: '17px', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                        Первоначальный капитал
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={formatNumber(value)}
                            onChange={handleChange}
                            placeholder="0"
                            style={{
                                width: '100%',
                                padding: '24px 56px 24px 24px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(241,245,249,0.82) 100%)',
                                border: '1px solid rgba(148, 163, 184, 0.38)',
                                borderRadius: '20px',
                                color: '#334155',
                                fontSize: '34px',
                                fontWeight: '700',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                textAlign: 'center',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.92), 0 10px 24px rgba(120, 140, 170, 0.14)'
                            }}
                        />
                        <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 24, fontWeight: 700, pointerEvents: 'none' }}>₽</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
                    Назад
                </button>
                <button className="btn-primary" onClick={onNext} style={{ flex: 1 }}>
                    Далее
                </button>
            </div>
        </div>
    );
};

export default StepAssets;
