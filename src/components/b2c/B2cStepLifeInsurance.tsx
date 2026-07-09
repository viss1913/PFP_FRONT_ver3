import React from 'react';
import { ArrowLeft, ArrowRight, Check, Info, Lock } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import {
    B2C_LIFE_INSURANCE_BULLETS,
    B2C_LIFE_INSURANCE_FORM,
} from '../../content/b2cLifeInsuranceStepCopy';
import { rangeFillStyle } from '../../utils/rangeInputStyle';

interface B2cStepLifeInsuranceProps {
    limit: number;
    minLimit: number;
    maxLimit: number;
    step: number;
    onLimitChange: (value: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

const formatCurrency = (val: number) =>
    `${new Intl.NumberFormat('ru-RU').format(Math.round(val))} ₽`;

const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));

const parseDigits = (raw: string) => Number(raw.replace(/\D/g, '')) || 0;

const B2cStepLifeInsurance: React.FC<B2cStepLifeInsuranceProps> = ({
    limit,
    minLimit,
    maxLimit,
    step,
    onLimitChange,
    onNext,
    onPrev,
}) => {
    const sliderMax = Math.max(maxLimit, minLimit + step);
    const clamped = Math.min(Math.max(limit, minLimit), maxLimit);
    const hasRange = maxLimit > minLimit;

    return (
        <div className="b2c-step-life">
            <div className="b2c-step-life__card">
                <aside className="b2c-step-life__visual">
                    <div className="b2c-step-life__media">
                        <img
                            src={b2cVisualAssets.lifeInsuranceHero}
                            alt="Финансовая защита семьи"
                            className="b2c-step-life__image"
                        />
                    </div>
                </aside>

                <div className="b2c-step-life__form">
                    <header className="b2c-step-life__header">
                        <p className="b2c-step-life__eyebrow">{B2C_LIFE_INSURANCE_FORM.eyebrow}</p>
                        <h2 className="b2c-step-life__title">{B2C_LIFE_INSURANCE_FORM.title}</h2>
                        <p className="b2c-step-life__subtitle">{B2C_LIFE_INSURANCE_FORM.description}</p>
                    </header>

                    <ul className="b2c-step-life__bullets">
                        {B2C_LIFE_INSURANCE_BULLETS.map((text) => (
                            <li key={text} className="b2c-step-life__bullet">
                                <span className="b2c-step-life__bullet-icon" aria-hidden>
                                    <Check size={14} strokeWidth={2.5} />
                                </span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="b2c-step-life__slider-block">
                        <label className="b2c-step-life__question" htmlFor="b2c-life-limit">
                            {B2C_LIFE_INSURANCE_FORM.question}
                        </label>

                        {hasRange ? (
                            <>
                                <div className="b2c-step-life__slider-row">
                                    <div className="b2c-step-life__slider-col">
                                        <input
                                            className="b2c-step-life__range"
                                            type="range"
                                            min={minLimit}
                                            max={sliderMax}
                                            step={step}
                                            value={clamped}
                                            onChange={(e) =>
                                                onLimitChange(
                                                    Math.min(Number(e.target.value), maxLimit),
                                                )
                                            }
                                            style={rangeFillStyle(clamped, minLimit, sliderMax)}
                                            aria-label={B2C_LIFE_INSURANCE_FORM.question}
                                        />
                                        <div className="b2c-step-life__range-ends">
                                            <span>{formatCurrency(minLimit)}</span>
                                            <span>{formatCurrency(maxLimit)}</span>
                                        </div>
                                    </div>
                                    <div className="b2c-step-life__value-box">
                                        <input
                                            id="b2c-life-limit"
                                            type="text"
                                            inputMode="numeric"
                                            className="b2c-step-life__value-input"
                                            value={formatNumber(clamped)}
                                            onChange={(e) =>
                                                onLimitChange(
                                                    Math.min(
                                                        Math.max(parseDigits(e.target.value), minLimit),
                                                        maxLimit,
                                                    ),
                                                )
                                            }
                                            autoComplete="off"
                                        />
                                        <span aria-hidden>₽</span>
                                    </div>
                                </div>
                                <p className="b2c-step-life__tip">
                                    <Info
                                        size={16}
                                        strokeWidth={2}
                                        className="b2c-step-life__tip-icon"
                                        aria-hidden
                                    />
                                    <span>{B2C_LIFE_INSURANCE_FORM.tip}</span>
                                </p>
                            </>
                        ) : (
                            <p className="b2c-step-life__zero-hint">
                                {B2C_LIFE_INSURANCE_FORM.zeroMaxHint}
                            </p>
                        )}
                    </div>

                    <div className="b2c-step-life__actions">
                        <button type="button" className="b2c-step-life__back" onClick={onPrev}>
                            <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
                            Назад
                        </button>
                        <button type="button" className="b2c-step-life__next" onClick={onNext}>
                            Далее
                            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                        </button>
                    </div>

                    <p className="b2c-step-life__trust">
                        <Lock size={14} strokeWidth={2} aria-hidden />
                        <span>{B2C_LIFE_INSURANCE_FORM.trust}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default B2cStepLifeInsurance;
