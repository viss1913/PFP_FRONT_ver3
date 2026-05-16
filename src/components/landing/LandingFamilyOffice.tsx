import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import LandingSection from './LandingSection';

interface LandingFamilyOfficeProps {
    copy: LandingCopy;
}

const LandingFamilyOffice: React.FC<LandingFamilyOfficeProps> = ({ copy }) => {
    const fo = copy.familyOffice;

    return (
        <LandingSection id="family-office" className="landing-section landing-section--dark">
            <div className="landing-container landing-fo">
                <h2 className="landing-section-title">{fo.title}</h2>
                <p className="landing-fo__definition">{fo.definition}</p>

                <div className="landing-fo__cards">
                    <article className="landing-fo__card">
                        <span className="landing-fo__card-label">{fo.forClient.label}</span>
                        <h3>{fo.forClient.title}</h3>
                        <p>{fo.forClient.description}</p>
                    </article>
                    <article className="landing-fo__card landing-fo__card--accent">
                        <span className="landing-fo__card-label">{fo.forAgent.label}</span>
                        <h3>{fo.forAgent.title}</h3>
                        <p>{fo.forAgent.description}</p>
                    </article>
                </div>

                <ul className="landing-fo__pillars">
                    {fo.pillars.map((pillar) => (
                        <li key={pillar}>{pillar}</li>
                    ))}
                </ul>
            </div>
        </LandingSection>
    );
};

export default LandingFamilyOffice;
