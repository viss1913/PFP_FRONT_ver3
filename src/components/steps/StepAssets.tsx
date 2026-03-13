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
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                marginBottom: '32px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-soft)',
                maxWidth: '500px',
                margin: '0 auto 32px auto' // Center the card
            }}>
                <div className="input-group">
                    <label className="label" style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Первоначальный капитал
                    </label>
                    <input
                        type="text"
                        value={formatNumber(value)}
                        onChange={handleChange}
                        placeholder="0"
                        style={{
                            width: '100%',
                            padding: '24px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '20px',
                            color: 'var(--primary)', // Highlight the money value
                            fontSize: '32px',
                            fontWeight: '700',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                        }}
                    />
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
