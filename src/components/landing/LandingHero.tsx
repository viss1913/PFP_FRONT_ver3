import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { useLandingActions } from '../../context/LandingActionsContext';
import { landingVisualAssets } from '../../content/landingAssets';
import LandingCtaButton from './LandingCtaButton';

interface LandingHeroProps {
    copy: LandingCopy;
}

const LandingHero: React.FC<LandingHeroProps> = ({ copy }) => {
    const { onPrimaryCta } = useLandingActions();

    return (
        <section className="landing-hero">
            <div className="landing-container landing-hero__grid">
                <div>
                    <span className="landing-hero__pill">{copy.hero.pill}</span>
                    <h1 className="landing-hero__title">
                        {copy.hero.title}
                        <br />
                        <span className="landing-serif-accent">{copy.hero.titleAccent}</span>
                    </h1>
                    <p className="landing-hero__subtitle">{copy.hero.subtitle}</p>
                    <div className="landing-cta-row landing-cta-row--single">
                        <LandingCtaButton variant="primary" onClick={() => onPrimaryCta('hero')}>
                            {copy.hero.cta}
                        </LandingCtaButton>
                    </div>
                </div>
                <div className="landing-hero__image-wrap">
                    <img
                        className="landing-hero__image"
                        src={landingVisualAssets.heroImage}
                        srcSet={landingVisualAssets.heroSrcSet}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        alt=""
                        loading="eager"
                    />
                </div>
            </div>
        </section>
    );
};

export default LandingHero;
