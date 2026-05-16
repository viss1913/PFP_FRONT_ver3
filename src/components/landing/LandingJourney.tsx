import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import LandingSection from './LandingSection';

interface LandingJourneyProps {
    copy: LandingCopy;
}

const LandingJourney: React.FC<LandingJourneyProps> = ({ copy }) => (
    <LandingSection className="landing-section landing-section--dark">
        <div className="landing-container">
            <h2 className="landing-section-title">{copy.journey.title}</h2>
            <p className="landing-section-subtitle">{copy.journey.subtitle}</p>
            <div className="landing-journey__steps">
                {copy.journey.steps.map((step, i) => (
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

export default LandingJourney;
