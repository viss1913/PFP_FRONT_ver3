import React from 'react';
import { ArrowRight, Info, Lock } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import { B2C_ASSETS_FORM, B2C_ASSETS_VISUAL } from '../../content/b2cAssetsStepCopy';

interface B2cStepAssetsProps {
    value: number;
    onChange: (value: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

const B2cStepAssets: React.FC<B2cStepAssetsProps> = ({ value, onChange, onNext, onPrev }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        onChange(Number(rawValue) || 0);
    };

    return (
        <div className="b2c-step-assets">
            <div className="b2c-step-assets__card">
                <aside className="b2c-step-assets__visual">
                    <div className="b2c-step-assets__media">
                        <img
                            src={b2cVisualAssets.assetsHero}
                            alt="Ваш капитал — основа вашего будущего"
                            className="b2c-step-assets__image"
                        />
                    </div>
                    <div className="b2c-step-assets__visual-copy">
                        <h2 className="b2c-step-assets__visual-title">{B2C_ASSETS_VISUAL.title}</h2>
                        <p className="b2c-step-assets__visual-desc">{B2C_ASSETS_VISUAL.description}</p>
                    </div>
                </aside>

                <div className="b2c-step-assets__form">
                    <header className="b2c-step-assets__header">
                        <h2 className="b2c-step-assets__title">{B2C_ASSETS_FORM.title}</h2>
                        <p className="b2c-step-assets__subtitle">{B2C_ASSETS_FORM.subtitle}</p>
                    </header>

                    <div className="b2c-step-assets__field">
                        <label className="b2c-step-assets__label" htmlFor="b2c-assets-capital">
                            {B2C_ASSETS_FORM.fieldLabel}
                        </label>
                        <div className="b2c-step-assets__input-wrap">
                            <input
                                id="b2c-assets-capital"
                                type="text"
                                inputMode="numeric"
                                className="b2c-step-assets__input"
                                value={formatNumber(value)}
                                onChange={handleChange}
                                placeholder="0"
                                autoComplete="off"
                            />
                            <span className="b2c-step-assets__currency" aria-hidden>
                                ₽
                            </span>
                        </div>
                    </div>

                    <p className="b2c-step-assets__tip">
                        <Info size={16} strokeWidth={2} className="b2c-step-assets__tip-icon" aria-hidden />
                        <span>{B2C_ASSETS_FORM.tip}</span>
                    </p>

                    <div className="b2c-step-assets__actions">
                        <button type="button" className="b2c-step-assets__back" onClick={onPrev}>
                            Назад
                        </button>
                        <button type="button" className="b2c-step-assets__next" onClick={onNext}>
                            Далее
                            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                        </button>
                    </div>

                    <p className="b2c-step-assets__trust">
                        <Lock size={14} strokeWidth={2} aria-hidden />
                        <span>{B2C_ASSETS_FORM.trust}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default B2cStepAssets;
