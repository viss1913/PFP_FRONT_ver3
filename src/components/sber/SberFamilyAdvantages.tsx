import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';

const SberFamilyAdvantages: React.FC = () => {
    const copy = sberLandingCopy.familyAdvantages;

    return (
        <section className="sber-section sber-family-advantages" id="family-advantages">
            <div className="sber-container">
                <div className="sber-family-advantages__layout">
                    <div className="sber-family-advantages__intro">
                        <h2 className="sber-family-advantages__title">{copy.title}</h2>
                        <p className="sber-family-advantages__lead">{copy.intro}</p>
                    </div>
                    <div className="sber-family-advantages__grid">
                        {copy.items.map((item) => (
                            <article key={item.title} className="sber-card sber-family-advantages__item">
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="sber-family-advantages__stats">
                    <p className="sber-family-advantages__stats-title">{copy.statsTitle}</p>
                    <div className="sber-family-advantages__stats-row">
                        {copy.stats.map((stat) => (
                            <div key={stat.value} className="sber-family-advantages__stat">
                                <span className="sber-family-advantages__stat-value">{stat.value}</span>
                                <span className="sber-family-advantages__stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SberFamilyAdvantages;
