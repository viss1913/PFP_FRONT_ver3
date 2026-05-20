import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { sberLandingAssets } from '../../content/sberLandingAssets';

interface SberHeroProps {
    onOpenFo: () => void;
}

const SberHero: React.FC<SberHeroProps> = ({ onOpenFo }) => {
    const copy = sberLandingCopy.hero;

    return (
        <section className="sber-hero">
            <div className="sber-hero__media" aria-hidden>
                <img
                    className="sber-hero__bg"
                    src={sberLandingAssets.heroCover}
                    alt=""
                    width={1920}
                    height={1080}
                    loading="eager"
                    decoding="async"
                />
            </div>
            <div className="sber-hero__scrim" aria-hidden />
            <div className="sber-container sber-hero__inner">
                <div className="sber-hero__copy">
                    <span className="sber-hero__pill">{copy.pill}</span>
                    <h1 className="sber-hero__title">
                        {copy.title}
                        <span className="sber-hero__title-accent">{copy.titleAccent}</span>
                    </h1>
                    <p className="sber-hero__subtitle">{copy.subtitle}</p>
                    <div className="sber-hero__cta-row">
                        <button type="button" className="sber-btn sber-btn--primary" onClick={onOpenFo}>
                            {copy.ctaPrimary}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SberHero;
