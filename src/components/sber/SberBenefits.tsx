import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { sberLandingAssets } from '../../content/sberLandingAssets';

const ICON_MAP = {
    goals: sberLandingAssets.icons.goals,
    growth: sberLandingAssets.icons.growth,
    control: sberLandingAssets.icons.control,
} as const;

const SberBenefits: React.FC = () => {
    const copy = sberLandingCopy.benefits;

    return (
        <section className="sber-section sber-benefits" id="benefits">
            <div className="sber-container">
                <h2 className="sber-section__title">{copy.title}</h2>
                <div className="sber-benefits__grid">
                    {copy.items.map((item) => (
                        <article key={item.title} className="sber-card">
                            <img
                                src={ICON_MAP[item.iconKey]}
                                alt=""
                                className="sber-card__icon"
                                width={48}
                                height={48}
                            />
                            <h3>{item.title}</h3>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SberBenefits;
