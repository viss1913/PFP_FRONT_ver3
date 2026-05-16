import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';

interface LandingSuccessPathProps {
    copy: LandingCopy;
}

const LandingSuccessPath: React.FC<LandingSuccessPathProps> = ({ copy }) => (
    <section className="landing-section landing-section--dark">
        <div className="landing-container">
            <h2 className="landing-section-title">{copy.successPath.title}</h2>
            <div className="landing-timeline">
                {copy.successPath.steps.map((step) => (
                    <div key={step.title} className="landing-timeline__item">
                        <span className="landing-timeline__dot" />
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default LandingSuccessPath;
