import React from 'react';
import {
    ClipboardList,
    PieChart,
    TrendingUp,
    Shield,
    Landmark,
    Gem,
} from 'lucide-react';
import type { LandingCopy } from '../../content/landingCopy';
import LandingSection from './LandingSection';

const SERVICE_ICONS = [ClipboardList, PieChart, TrendingUp, Shield, Landmark, Gem];

interface LandingServicesProps {
    copy: LandingCopy;
}

const LandingServices: React.FC<LandingServicesProps> = ({ copy }) => (
    <LandingSection id="services" className="landing-section landing-section--light">
        <div className="landing-container">
            <h2 className="landing-section-title">{copy.services.title}</h2>
            <p className="landing-section-subtitle">{copy.services.subtitle}</p>
            <div className="landing-services__grid">
                {copy.services.items.map((item, i) => {
                    const Icon = SERVICE_ICONS[i] ?? ClipboardList;
                    return (
                        <article key={item.title} className="landing-service-card">
                            <div className="landing-service-card__icon">
                                <Icon size={24} strokeWidth={1.75} />
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </article>
                    );
                })}
            </div>
        </div>
    </LandingSection>
);

export default LandingServices;
