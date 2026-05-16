import React from 'react';
import '../styles/landing.css';
import { useLandingPreferences } from '../hooks/useLandingPreferences';
import LandingButton from '../components/landing/LandingButton';

interface PrivacyPolicyPageProps {
    onBackHome: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBackHome }) => {
    const { copy } = useLandingPreferences();

    return (
        <div className="landing-privacy landing-privacy--document">
            <div className="landing-privacy__inner">
                <h1>{copy.privacy.title}</h1>
                <p className="landing-privacy__lead">{copy.privacy.stub}</p>
                {copy.privacy.sections.map((section) => (
                    <section key={section.heading} className="landing-privacy__section">
                        <h2>{section.heading}</h2>
                        <p>{section.body}</p>
                    </section>
                ))}
                <LandingButton
                    variant="primary"
                    onClick={(e) => {
                        e.preventDefault();
                        onBackHome();
                    }}
                >
                    {copy.privacy.backHome}
                </LandingButton>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
