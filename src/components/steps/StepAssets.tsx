import React, { useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import type { Asset, AssetType } from '../../types/client';

interface StepAssetsProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const ASSET_TYPES: { type: AssetType; label: string }[] = [
    { type: 'DEPOSIT', label: 'Вклад' },
    { type: 'CASH', label: 'Наличные' },
    { type: 'BROKERAGE', label: 'Брокерский счет' },
    { type: 'PDS', label: 'ПДС' },
    { type: 'NSJ', label: 'НСЖ' },
    { type: 'IIS', label: 'ИИС' },
    { type: 'REAL_ESTATE', label: 'Недвижимость' },
    { type: 'CRYPTO', label: 'Криптовалюта' },
    { type: 'OTHER', label: 'Другое' },
];

const StepAssets: React.FC<StepAssetsProps> = ({ data, setData, onNext, onPrev }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        type: 'DEPOSIT',
        name: '',
        current_value: 0,
        currency: 'RUB'
    });

    const assets = data.assets || [];
    const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

    const handleAdd = () => {
        if (!newAsset.name || !newAsset.current_value) return;

        const assetToAdd: Asset = {
            type: newAsset.type as AssetType,
            name: newAsset.name,
            current_value: Number(newAsset.current_value),
            currency: 'RUB'
        };

        setData(prev => ({
            ...prev,
            assets: [...(prev.assets || []), assetToAdd]
        }));
        setNewAsset({ type: 'DEPOSIT', name: '', current_value: 0, currency: 'RUB' });
        setIsAdding(false);
    };

    const handleRemove = (index: number) => {
        setData(prev => ({
            ...prev,
            assets: prev.assets?.filter((_, i) => i !== index)
        }));
    };

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Ваши Активы</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Укажите, что у вас уже есть. Это сформирует ваш стартовый капитал.
                </p>
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(255, 199, 80, 0.1)',
                    borderRadius: '12px',
                    display: 'inline-block'
                }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Итого активов</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
                        {totalAssets.toLocaleString('ru-RU')} ₽
                    </div>
                </div>
            </div>

            <div className="assets-list" style={{ marginBottom: '24px' }}>
                {assets.map((asset, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        marginBottom: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Wallet size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{asset.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {ASSET_TYPES.find(t => t.type === asset.type)?.label}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontWeight: '600' }}>{asset.current_value.toLocaleString('ru-RU')} ₽</span>
                            <button
                                onClick={() => handleRemove(index)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', padding: '4px' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Добавить актив</h3>

                    <div className="input-group">
                        <label className="label">Тип актива</label>
                        <select
                            value={newAsset.type}
                            onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as AssetType })}
                            style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        >
                            {ASSET_TYPES.map(t => (
                                <option key={t.type} value={t.type}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="label">Название</label>
                        <input
                            type="text"
                            value={newAsset.name}
                            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                            placeholder="Например: Вклад в Сбербанке"
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Сумма (₽)</label>
                        <input
                            type="number"
                            value={newAsset.current_value || ''}
                            onChange={(e) => setNewAsset({ ...newAsset, current_value: Number(e.target.value) })}
                            placeholder="0"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn-primary"
                            onClick={handleAdd}
                            disabled={!newAsset.name || !newAsset.current_value}
                        >
                            Добавить
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => setIsAdding(false)}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '2px dashed rgba(255,255,255,0.2)',
                        background: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '32px'
                    }}
                >
                    <Plus size={20} />
                    Добавить актив
                </button>
            )}

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
