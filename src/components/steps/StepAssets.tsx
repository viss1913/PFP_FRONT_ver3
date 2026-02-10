import React, { useState, useEffect } from 'react';
import type { CJMData } from '../CJMFlow';
import type { Asset } from '../../types/client';

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
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Ваши Активы</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Укажите, что у вас уже есть. Это сформирует ваш стартовый капитал.
                </p>
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
