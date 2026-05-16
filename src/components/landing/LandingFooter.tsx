import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';

interface LandingFooterProps {
    copy: LandingCopy;
    onPrivacyClick: () => void;
}

const SOCIAL = ['FB', 'IG', 'IN', 'YT'];

const LandingFooter: React.FC<LandingFooterProps> = ({ copy, onPrivacyClick }) => (
    <footer className="landing-footer">
        <div className="landing-container">
            <div className="landing-footer__brand">
                <p className="landing-footer__logo">BankFuture</p>
                <p className="landing-footer__tagline">{copy.footer.tagline}</p>
            </div>
            <div className="landing-footer__social">
                {SOCIAL.map((label) => (
                    <a key={label} href="#" aria-label={label} onClick={(e) => e.preventDefault()}>
                        {label}
                    </a>
                ))}
            </div>
            <p className="landing-footer__disclaimer">{copy.footer.disclaimer}</p>
            <div className="landing-footer__legal">
                <span>{copy.footer.copyright}</span>
                <a
                    href="?page=privacy"
                    className="landing-footer__privacy"
                    onClick={(e) => {
                        e.preventDefault();
                        onPrivacyClick();
                    }}
                >
                    {copy.footer.privacy}
                </a>
                <span className="landing-footer__entity">{copy.footer.legalEntity}</span>
            </div>
        </div>
    </footer>
);

export default LandingFooter;
