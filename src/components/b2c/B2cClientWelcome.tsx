import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Lock, PieChart, Shield, Target } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import {
    B2C_WELCOME_FEATURES,
    B2C_WELCOME_HERO,
    buildB2cWelcomeChatMessage,
    type B2cWelcomeFeature,
} from '../../content/b2cWelcomeCopy';

interface B2cClientWelcomeProps {
    inviterName?: string;
    onStart: () => void;
}

const FEATURE_ICONS: Record<B2cWelcomeFeature['icon'], typeof Target> = {
    target: Target,
    clock: Clock3,
    shield: Shield,
    chart: PieChart,
};

const CHAR_MS = 12;

const B2cClientWelcome: React.FC<B2cClientWelcomeProps> = ({ inviterName, onStart }) => {
    const fullMessage = useMemo(() => buildB2cWelcomeChatMessage(inviterName), [inviterName]);
    const [typedLen, setTypedLen] = useState(0);
    const [streamDone, setStreamDone] = useState(false);

    useEffect(() => {
        setTypedLen(0);
        setStreamDone(false);

        let cancelled = false;
        let char = 0;
        const charTimer = window.setInterval(() => {
            if (cancelled) {
                window.clearInterval(charTimer);
                return;
            }
            char += 1;
            setTypedLen(char);
            if (char >= fullMessage.length) {
                setStreamDone(true);
                window.clearInterval(charTimer);
            }
        }, CHAR_MS);

        return () => {
            cancelled = true;
            window.clearInterval(charTimer);
        };
    }, [fullMessage]);

    const visibleText = fullMessage.slice(0, typedLen);

    return (
        <section className="b2c-welcome" aria-labelledby="b2c-welcome-cta">
            <aside className="b2c-welcome__chat-panel" aria-label="AI-консультант">
                <div className="b2c-welcome__profile">
                    <img
                        src={b2cVisualAssets.victoriaAvatar}
                        alt="Виктория"
                        className="b2c-welcome__avatar"
                    />
                    <div className="b2c-welcome__profile-text">
                        <div className="b2c-welcome__name">Виктория</div>
                        <div className="b2c-welcome__role">AI-консультант</div>
                    </div>
                    <span className="b2c-welcome__online">Online</span>
                </div>

                <div className="b2c-welcome__messages" aria-live="polite">
                    {visibleText ? (
                        <div className="b2c-welcome__bubble">
                            <p className="b2c-welcome__bubble-text">
                                {visibleText}
                                {!streamDone ? <span className="b2c-welcome__caret" aria-hidden /> : null}
                            </p>
                        </div>
                    ) : null}
                </div>
            </aside>

            <div className="b2c-welcome__hero-panel">
                <img
                    src={b2cVisualAssets.welcomeDoorsHero}
                    alt=""
                    className="b2c-welcome__hero-image"
                    decoding="async"
                />
                <div className="b2c-welcome__hero-scrim" aria-hidden />

                <div className="b2c-welcome__hero-content">
                    <p className="b2c-welcome__brand">{B2C_WELCOME_HERO.brand}</p>
                    <h1 className="b2c-welcome__headline">
                        {B2C_WELCOME_HERO.headlineBefore}{' '}
                        <span className="b2c-welcome__headline-accent">{B2C_WELCOME_HERO.headlineAccent}</span>
                    </h1>
                    <p className="b2c-welcome__subtitle">{B2C_WELCOME_HERO.subtitle}</p>

                    <ul className="b2c-welcome__features">
                        {B2C_WELCOME_FEATURES.map((feature) => {
                            const Icon = FEATURE_ICONS[feature.icon];
                            return (
                                <li key={feature.id} className="b2c-welcome__feature">
                                    <span className="b2c-welcome__feature-icon" aria-hidden>
                                        <Icon size={18} strokeWidth={1.9} />
                                    </span>
                                    <span className="b2c-welcome__feature-text">{feature.title}</span>
                                </li>
                            );
                        })}
                    </ul>

                    <button
                        id="b2c-welcome-cta"
                        type="button"
                        className="b2c-welcome__cta"
                        onClick={onStart}
                    >
                        <span>{B2C_WELCOME_HERO.cta}</span>
                        <ArrowRight size={20} strokeWidth={2.25} aria-hidden />
                    </button>

                    <p className="b2c-welcome__trust">
                        <Lock size={14} strokeWidth={2} aria-hidden />
                        <span>{B2C_WELCOME_HERO.trust}</span>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default B2cClientWelcome;
