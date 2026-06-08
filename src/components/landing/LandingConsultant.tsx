import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { useLandingActions } from '../../context/LandingActionsContext';
import LandingCtaButton from './LandingCtaButton';
import LandingSection from './LandingSection';

interface LandingConsultantProps {
    copy: LandingCopy;
}

const LandingConsultant: React.FC<LandingConsultantProps> = ({ copy }) => {
    const { openLeadForm } = useLandingActions();

    return (
        <LandingSection id="consultant" className="landing-section">
            <div className="landing-container landing-consultant__grid">
                <div>
                    <h2 className="landing-section-title">{copy.consultant.title}</h2>
                    <p className="landing-section-subtitle">{copy.consultant.subtitle}</p>
                    <p className="landing-consultant__seo-intro">{copy.consultant.seoIntro}</p>
                    <ul className="landing-consultant__benefits">
                        {copy.consultant.benefits.map((b) => (
                            <li key={b}>
                                <span className="landing-check">✓</span>
                                {b}
                            </li>
                        ))}
                    </ul>
                    <div className="landing-cta-row" style={{ marginTop: 24 }}>
                        <LandingCtaButton
                            variant="secondary"
                            onClick={() => openLeadForm('consultant', 'consultant-block')}
                        >
                            {copy.consultant.applyCta}
                        </LandingCtaButton>
                    </div>
                </div>
                <div className="landing-mockup" aria-hidden>
                    <div className="landing-mockup__screen">
                        <p className="landing-mockup__title">{copy.consultant.dashboardTitle}</p>
                        <div className="landing-mockup__stat">
                            <div className="landing-mockup__stat-value">128</div>
                            <p className="landing-mockup__stat-label">{copy.consultant.totalClients}</p>
                            <div className="landing-mockup__chart landing-mockup__chart--line" />
                        </div>
                        <div className="landing-mockup__stat">
                            <div className="landing-mockup__stat-value">₽840K</div>
                            <p className="landing-mockup__stat-label">{copy.consultant.monthlyIncome}</p>
                            <div className="landing-mockup__chart landing-mockup__chart--bars" />
                        </div>
                    </div>
                </div>
            </div>
        </LandingSection>
    );
};

export default LandingConsultant;
