import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { sberLandingAssets } from '../../content/sberLandingAssets';

const PARTNER_LOGO_MAP = {
    bank: sberLandingAssets.partners.bank,
    npf: sberLandingAssets.partners.npf,
    life: sberLandingAssets.partners.life,
    pervaya: sberLandingAssets.partners.pervaya,
    invest: sberLandingAssets.partners.invest,
} as const;

const SberEcosystem: React.FC = () => {
    const copy = sberLandingCopy.ecosystem;

    return (
        <section className="sber-section sber-ecosystem" id="ecosystem">
            <div className="sber-container">
                <h2 className="sber-section__title">{copy.title}</h2>
                <div className="sber-ecosystem__grid">
                    {copy.items.map((item) => (
                        <article key={item.id} className="sber-card sber-ecosystem__card">
                            <img
                                src={PARTNER_LOGO_MAP[item.partnerKey]}
                                alt={item.name}
                                className="sber-ecosystem__logo"
                            />
                            <h3>{item.name}</h3>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SberEcosystem;
