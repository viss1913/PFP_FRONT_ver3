import React from 'react';
import { Users, Wallet, TrendingUp, type LucideIcon } from 'lucide-react';
import type { LandingCopy } from '../../content/landingCopy';
import { landingVisualAssets } from '../../content/landingAssets';
import LandingSection from './LandingSection';

const STAT_ICONS: LucideIcon[] = [Users, Wallet, TrendingUp];

interface LandingStatsProps {
    copy: LandingCopy;
}

const LandingStats: React.FC<LandingStatsProps> = ({ copy }) => (
    <LandingSection className="landing-section landing-section--dark landing-stats-section">
        <div className="landing-container">
            <h2 className="landing-section-title landing-stats-section__title">{copy.stats.title}</h2>

            <div className="landing-stats__layout">
                <div className="landing-stats__visual">
                    <img
                        src={landingVisualAssets.statsIllustration}
                        alt=""
                        className="landing-stats__illustration"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="landing-stats__visual-glow" aria-hidden />
                </div>

                <div className="landing-stats__cards">
                    {copy.stats.items.map((item, i) => {
                        const Icon = STAT_ICONS[i] ?? Users;
                        return (
                            <article key={item.value} className="landing-stat-card">
                                <div className="landing-stat-card__icon-wrap">
                                    <Icon size={28} strokeWidth={1.75} aria-hidden />
                                </div>
                                <div className="landing-stat-card__body">
                                    <div className="landing-stat-card__value">{item.value}</div>
                                    <p className="landing-stat-card__label">{item.label}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <div className="landing-benefits landing-benefits--panel">
                <h3 className="landing-benefits__title">{copy.stats.benefitsTitle}</h3>
                <ul className="landing-benefits__list">
                    {copy.stats.benefits.map((b) => (
                        <li key={b}>
                            <span className="landing-check">✓</span>
                            {b}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </LandingSection>
);

export default LandingStats;
