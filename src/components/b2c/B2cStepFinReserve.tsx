import React from 'react';
import { ArrowLeft, ArrowRight, Info, Lightbulb, Lock } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import { B2C_FIN_RESERVE_FORM } from '../../content/b2cFinReserveStepCopy';
import { formatCompactRubles } from '../../utils/finReserveRecommendations';
import { rangeFillStyle } from '../../utils/rangeInputStyle';

interface B2cStepFinReserveProps {
    availableCapital: number;
    onAvailableCapitalChange: (value: number) => void;
    initialCapital: number;
    onInitialCapitalChange: (value: number) => void;
    monthlyReplenishment: number;
    onMonthlyReplenishmentChange: (value: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));

const parseDigits = (raw: string) => Number(raw.replace(/\D/g, '')) || 0;

const B2cStepFinReserve: React.FC<B2cStepFinReserveProps> = ({
    availableCapital,
    onAvailableCapitalChange,
    initialCapital,
    onInitialCapitalChange,
    monthlyReplenishment,
    onMonthlyReplenishmentChange,
    onNext,
    onPrev,
}) => {
    const reserveMax = availableCapital > 0 ? availableCapital : 1_000_000;
    const reserveStep = Math.max(1000, Math.floor(reserveMax / 100));
    const monthlyMax = 200_000;

    const clampedInitial = Math.min(Math.max(0, initialCapital), reserveMax);
    const clampedMonthly = Math.min(Math.max(0, monthlyReplenishment), monthlyMax);

    return (
        <div className="b2c-step-reserve">
            <div className="b2c-step-reserve__card">
                <aside className="b2c-step-reserve__visual">
                    <div className="b2c-step-reserve__media">
                        <img
                            src={b2cVisualAssets.reserveHero}
                            alt=""
                            className="b2c-step-reserve__image"
                        />
                    </div>
                </aside>

                <div className="b2c-step-reserve__form">
                    <header className="b2c-step-reserve__header">
                        <p className="b2c-step-reserve__eyebrow">{B2C_FIN_RESERVE_FORM.eyebrow}</p>
                        <h2 className="b2c-step-reserve__title">{B2C_FIN_RESERVE_FORM.title}</h2>
                        <p className="b2c-step-reserve__subtitle">{B2C_FIN_RESERVE_FORM.description}</p>
                    </header>

                    <p className="b2c-step-reserve__tip">
                        <Lightbulb size={18} strokeWidth={2} className="b2c-step-reserve__tip-icon" aria-hidden />
                        <span>{B2C_FIN_RESERVE_FORM.tip}</span>
                    </p>

                    <div className="b2c-step-reserve__field">
                        <label className="b2c-step-reserve__label" htmlFor="b2c-reserve-capital">
                            {B2C_FIN_RESERVE_FORM.capitalLabel}
                        </label>
                        <div className="b2c-step-reserve__input-wrap">
                            <input
                                id="b2c-reserve-capital"
                                type="text"
                                inputMode="numeric"
                                className="b2c-step-reserve__input"
                                value={formatNumber(availableCapital)}
                                onChange={(e) => onAvailableCapitalChange(parseDigits(e.target.value))}
                                autoComplete="off"
                            />
                            <span className="b2c-step-reserve__currency" aria-hidden>
                                ₽
                            </span>
                        </div>
                    </div>

                    <div className="b2c-step-reserve__slider-block">
                        <div className="b2c-step-reserve__slider-head">
                            <label className="b2c-step-reserve__label" htmlFor="b2c-reserve-initial">
                                <span>{B2C_FIN_RESERVE_FORM.reserveLabel}</span>
                                <Info size={14} strokeWidth={2} className="b2c-step-reserve__info" aria-hidden />
                            </label>
                            <div className="b2c-step-reserve__value-box">
                                <input
                                    id="b2c-reserve-initial"
                                    type="text"
                                    inputMode="numeric"
                                    className="b2c-step-reserve__value-input"
                                    value={formatNumber(clampedInitial)}
                                    onChange={(e) =>
                                        onInitialCapitalChange(Math.min(parseDigits(e.target.value), reserveMax))
                                    }
                                    autoComplete="off"
                                />
                                <span aria-hidden>₽</span>
                            </div>
                        </div>
                        <input
                            className="b2c-step-reserve__range"
                            type="range"
                            min={0}
                            max={reserveMax}
                            step={reserveStep}
                            value={clampedInitial}
                            onChange={(e) => onInitialCapitalChange(Number(e.target.value))}
                            style={rangeFillStyle(clampedInitial, 0, reserveMax)}
                            aria-label={B2C_FIN_RESERVE_FORM.reserveLabel}
                        />
                        <div className="b2c-step-reserve__range-ends">
                            <span>{formatCompactRubles(0)}</span>
                            <span>{formatCompactRubles(reserveMax)}</span>
                        </div>
                    </div>

                    <div className="b2c-step-reserve__slider-block">
                        <div className="b2c-step-reserve__slider-head">
                            <label className="b2c-step-reserve__label" htmlFor="b2c-reserve-monthly">
                                <span>{B2C_FIN_RESERVE_FORM.monthlyLabel}</span>
                                <Info size={14} strokeWidth={2} className="b2c-step-reserve__info" aria-hidden />
                            </label>
                            <div className="b2c-step-reserve__value-box">
                                <input
                                    id="b2c-reserve-monthly"
                                    type="text"
                                    inputMode="numeric"
                                    className="b2c-step-reserve__value-input"
                                    value={formatNumber(clampedMonthly)}
                                    onChange={(e) =>
                                        onMonthlyReplenishmentChange(
                                            Math.min(parseDigits(e.target.value), monthlyMax),
                                        )
                                    }
                                    autoComplete="off"
                                />
                                <span aria-hidden>₽</span>
                            </div>
                        </div>
                        <input
                            className="b2c-step-reserve__range"
                            type="range"
                            min={0}
                            max={monthlyMax}
                            step={5000}
                            value={clampedMonthly}
                            onChange={(e) => onMonthlyReplenishmentChange(Number(e.target.value))}
                            style={rangeFillStyle(clampedMonthly, 0, monthlyMax)}
                            aria-label={B2C_FIN_RESERVE_FORM.monthlyLabel}
                        />
                        <div className="b2c-step-reserve__range-ends">
                            <span>{formatCompactRubles(0)}</span>
                            <span>{formatCompactRubles(monthlyMax)}</span>
                        </div>
                    </div>

                    <div className="b2c-step-reserve__actions">
                        <button type="button" className="b2c-step-reserve__back" onClick={onPrev}>
                            <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
                            Назад
                        </button>
                        <button type="button" className="b2c-step-reserve__next" onClick={onNext}>
                            Далее
                            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                        </button>
                    </div>

                    <p className="b2c-step-reserve__trust">
                        <Lock size={14} strokeWidth={2} aria-hidden />
                        <span>{B2C_FIN_RESERVE_FORM.trust}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default B2cStepFinReserve;
