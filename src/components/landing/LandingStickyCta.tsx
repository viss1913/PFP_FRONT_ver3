import React, { useEffect, useState } from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { useLandingActions } from '../../context/LandingActionsContext';
import LandingCtaButton from './LandingCtaButton';

interface LandingStickyCtaProps {
    copy: LandingCopy;
}

const LandingStickyCta: React.FC<LandingStickyCtaProps> = ({ copy }) => {
    const { onPrimaryCta } = useLandingActions();
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const footer = document.querySelector('.landing-footer');
        if (!footer) return;

        const observer = new IntersectionObserver(
            ([entry]) => setHidden(entry.isIntersecting),
            { threshold: 0.15 }
        );
        observer.observe(footer);
        return () => observer.disconnect();
    }, []);

    if (hidden) return null;

    return (
        <div className="landing-sticky-cta landing-sticky-cta--single" aria-hidden={false}>
            <LandingCtaButton variant="primary" onClick={() => onPrimaryCta('sticky')}>
                {copy.hero.cta}
            </LandingCtaButton>
        </div>
    );
};

export default LandingStickyCta;
