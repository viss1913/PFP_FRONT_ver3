import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import LandingSection from './LandingSection';

interface LandingHowItWorksProps {
    copy: LandingCopy;
}

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ copy }) => (
    <LandingSection id="how-it-works" className="landing-section">
        <div className="landing-container">
            <h2 className="landing-section-title">{copy.howItWorks.title}</h2>
            <p className="landing-section-subtitle">{copy.howItWorks.subtitle}</p>
            <div className="landing-journey__steps">
                {copy.howItWorks.steps.map((step, i) => (
                    <div key={step.title} className="landing-journey-step">
                        <div className="landing-journey-step__num">{i + 1}</div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </LandingSection>
);

export default LandingHowItWorks;
