import React from 'react';
import type { LandingCopy, LandingLang } from '../../content/landingCopy';
import { landingPartners } from '../../content/landingAssets';
import LandingSection from './LandingSection';

interface LandingPartnersProps {
    copy: LandingCopy;
    lang: LandingLang;
}

const LandingPartners: React.FC<LandingPartnersProps> = ({ copy, lang }) => (
    <LandingSection id="partners" className="landing-section landing-section--dark">
        <div className="landing-container">
            <h2 className="landing-section-title" style={{ textAlign: 'center' }}>
                {copy.partners.title}
            </h2>
            <div className="landing-partners__grid" style={{ marginTop: 40 }}>
                {landingPartners.map((p) => (
                    <div key={p.id} className="landing-partner-logo" title={lang === 'ru' ? p.nameRu : p.nameEn}>
                        <img
                            src={p.logo}
                            alt={lang === 'ru' ? p.nameRu : p.nameEn}
                            loading="lazy"
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.landing-partner-fallback')) {
                                    const span = document.createElement('span');
                                    span.className = 'landing-partner-fallback';
                                    span.textContent = p.placeholder;
                                    parent.appendChild(span);
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    </LandingSection>
);

export default LandingPartners;
