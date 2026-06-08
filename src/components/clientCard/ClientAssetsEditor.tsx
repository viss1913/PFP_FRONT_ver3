import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Asset, AssetType } from '../../types/client';
import { ASSET_TYPE_OPTIONS, formatMoneyInput, parseMoneyInput } from '../../utils/clientCardMappers';

interface ClientAssetsEditorProps {
    assets: Asset[];
    onChange: (assets: Asset[]) => void;
}

const ClientAssetsEditor: React.FC<ClientAssetsEditorProps> = ({ assets, onChange }) => {
    const updateAt = (index: number, patch: Partial<Asset>) => {
        onChange(assets.map((a, i) => (i === index ? { ...a, ...patch } : a)));
    };

    const removeAt = (index: number) => {
        onChange(assets.filter((_, i) => i !== index));
    };

    const addAsset = () => {
        onChange([
            ...assets,
            {
                type: 'CASH' as AssetType,
                name: 'Наличные',
                current_value: 0,
                currency: 'RUB',
            },
        ]);
    };

    return (
        <div className="client-card-section">
            <p className="client-card-hint">
                Активы с типом «Недвижимость (расчёт)» участвуют в net worth. Справочная недвижимость
                семьи — на вкладке «Семья».
            </p>
            {assets.length === 0 ? (
                <p className="client-card-empty">Пока нет активов.</p>
            ) : (
                <div className="client-card-table-head client-card-table-head--assets">
                    <span>Тип</span>
                    <span>Название</span>
                    <span>Стоимость</span>
                    <span />
                </div>
            )}
            {assets.map((item, index) => (
                <div key={index} className="client-card-table-row client-card-table-row--assets">
                    <select
                        value={item.type}
                        onChange={(e) =>
                            updateAt(index, { type: e.target.value as AssetType })
                        }
                        className="client-card-input"
                    >
                        {ASSET_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateAt(index, { name: e.target.value })}
                        className="client-card-input"
                        placeholder="Название"
                    />
                    <div className="client-card-money-wrap">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatMoneyInput(item.current_value || 0)}
                            onChange={(e) =>
                                updateAt(index, { current_value: parseMoneyInput(e.target.value) })
                            }
                            className="client-card-input"
                        />
                        <span className="client-card-money-suffix">₽</span>
                    </div>
                    <button
                        type="button"
                        className="client-card-icon-btn"
                        onClick={() => removeAt(index)}
                        title="Удалить"
                        aria-label="Удалить актив"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button type="button" className="client-card-add-btn" onClick={addAsset}>
                <Plus size={16} />
                Добавить актив
            </button>
        </div>
    );
};

export default ClientAssetsEditor;
