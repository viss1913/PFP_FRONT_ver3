import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { useLandingActions } from '../../context/LandingActionsContext';
import LandingCtaButton from './LandingCtaButton';

interface LandingFinalCtaProps {
    copy: LandingCopy;
}

const LandingFinalCta: React.FC<LandingFinalCtaProps> = ({ copy }) => {
    const { onPrimaryCta } = useLandingActions();

    return (
        <section className="landing-final-cta">
            <div className="landing-container">
                <h2 className="landing-section-title">{copy.finalCta.title}</h2>
                <p className="landing-section-subtitle">{copy.finalCta.subtitle}</p>
                <div className="landing-cta-row landing-cta-row--single">
                    <LandingCtaButton variant="primary" onClick={() => onPrimaryCta('final')}>
                        {copy.finalCta.cta}
                    </LandingCtaButton>
                </div>
            </div>
        </section>
    );
};

export default LandingFinalCta;
