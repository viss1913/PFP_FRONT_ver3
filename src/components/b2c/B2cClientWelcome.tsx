import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, PieChart, Shield, Target, Users } from 'lucide-react';
import { b2cVisualAssets, B2C_WELCOME_PARTNERS } from '../../content/b2cAssets';
import { B2C_WELCOME_OUTCOMES, buildB2cWelcomeStreamText } from '../../content/b2cWelcomeCopy';

interface B2cClientWelcomeProps {
    inviterName?: string;
    onStart: () => void;
}

const OUTCOME_ICONS = [Target, PieChart, Shield, BarChart3, Users] as const;

const B2cClientWelcome: React.FC<B2cClientWelcomeProps> = ({ inviterName, onStart }) => {
    const fullMessage = useMemo(() => buildB2cWelcomeStreamText(inviterName), [inviterName]);
    const [visibleText, setVisibleText] = useState('');
    const [streamDone, setStreamDone] = useState(false);

    useEffect(() => {
        setVisibleText('');
        setStreamDone(false);
        let index = 0;
        const interval = window.setInterval(() => {
            index += 1;
            setVisibleText(fullMessage.slice(0, index));
            if (index >= fullMessage.length) {
                setStreamDone(true);
                window.clearInterval(interval);
            }
        }, 16);
        return () => window.clearInterval(interval);
    }, [fullMessage]);

    return (
        <section className="b2c-welcome" aria-labelledby="b2c-welcome-cta">
            <div className="b2c-welcome__hero">
                <div className="b2c-welcome__avatar-wrap">
                    <img
                        src={b2cVisualAssets.victoriaAvatar}
                        alt="Виктория — AI-консультант Family Office"
                        className="b2c-welcome__avatar"
                    />
                    <span className="b2c-welcome__online-dot" aria-hidden />
                </div>

                <div className="b2c-welcome__chat">
                    <div className="b2c-welcome__bubble" aria-live="polite">
                        <p className="b2c-welcome__bubble-text">
                            {visibleText}
                            {!streamDone ? <span className="b2c-welcome__caret" aria-hidden /> : null}
                        </p>

                        {streamDone ? (
                            <div className="b2c-welcome__outcomes">
                                {B2C_WELCOME_OUTCOMES.map((item, index) => {
                                    const Icon = OUTCOME_ICONS[index] ?? Target;
                                    return (
                                        <div key={item.title} className="b2c-welcome__outcome">
                                            <span className="b2c-welcome__outcome-icon" aria-hidden>
                                                <Icon size={22} strokeWidth={1.75} />
                                            </span>
                                            <p className="b2c-welcome__outcome-text">{item.title}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="b2c-welcome__partners">
                <p className="b2c-welcome__partners-title">Совместный проект надёжных партнёров</p>
                <div className="b2c-welcome__partners-grid">
                    {B2C_WELCOME_PARTNERS.map((partner) => (
                        <div key={partner.id} className="b2c-welcome__partner">
                            <img
                                src={partner.logo}
                                alt={partner.name}
                                className="b2c-welcome__partner-logo"
                                loading="lazy"
                            />
                            <p className="b2c-welcome__partner-desc">{partner.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="b2c-welcome__actions">
                <button
                    id="b2c-welcome-cta"
                    type="button"
                    className="b2c-welcome__cta"
                    onClick={onStart}
                    disabled={!streamDone}
                >
                    <span>Начать первую консультацию</span>
                    <ArrowRight size={20} strokeWidth={2.25} aria-hidden />
                </button>
            </div>
        </section>
    );
};

export default B2cClientWelcome;
