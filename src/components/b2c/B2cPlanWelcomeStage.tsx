import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { B2C_WELCOME_HERO } from '../../content/b2cWelcomeCopy';
import { b2cVisualAssets } from '../../content/b2cAssets';

interface B2cPlanWelcomeStageProps {
    onStart: () => void;
    isStreaming?: boolean;
}

const B2cPlanWelcomeStage: React.FC<B2cPlanWelcomeStageProps> = ({ onStart, isStreaming }) => (
    <div className="b2c-plan-welcome-stage">
        <img
            src={b2cVisualAssets.welcomeDoorsHero}
            alt=""
            className="b2c-plan-welcome-stage__hero-image"
            decoding="async"
        />
        <div className="b2c-plan-welcome-stage__scrim" aria-hidden />
        <div className="b2c-plan-welcome-stage__content">
            <p className="b2c-plan-welcome-stage__brand">{B2C_WELCOME_HERO.brand}</p>
            <h1 className="b2c-plan-welcome-stage__headline">
                {B2C_WELCOME_HERO.headlineBefore}{' '}
                <span className="b2c-plan-welcome-stage__headline-accent">{B2C_WELCOME_HERO.headlineAccent}</span>
            </h1>
            <p className="b2c-plan-welcome-stage__subtitle">{B2C_WELCOME_HERO.subtitle}</p>
            <button
                type="button"
                className="b2c-plan-welcome-stage__cta"
                onClick={onStart}
                disabled={isStreaming}
            >
                <span>{B2C_WELCOME_HERO.cta}</span>
                <ArrowRight size={20} strokeWidth={2.25} aria-hidden />
            </button>
            <p className="b2c-plan-welcome-stage__trust">
                <Lock size={14} strokeWidth={2} aria-hidden />
                <span>{B2C_WELCOME_HERO.trust}</span>
            </p>
        </div>
    </div>
);

export default B2cPlanWelcomeStage;
