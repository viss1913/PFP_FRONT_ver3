import React, { useEffect, useState } from 'react';
import type { LandingCopy } from '../../content/landingCopy';

const CONSENT_KEY = 'cookie_consent';

interface CookieConsentProps {
    copy: LandingCopy;
    onLearnMore: () => void;
    onVisibilityChange?: (visible: boolean) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ copy, onLearnMore, onVisibilityChange }) => {
    const [visible, setVisible] = useState(() => !localStorage.getItem(CONSENT_KEY));
    const [pdnConsent, setPdnConsent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        onVisibilityChange?.(visible);
    }, [visible, onVisibilityChange]);

    if (!visible) return null;

    const accept = () => {
        if (!pdnConsent) {
            setError(copy.cookies.pdnRequired);
            return;
        }
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, pdn: true, at: Date.now() }));
        setVisible(false);
    };

    return (
        <div className="landing-cookie" role="dialog" aria-label="Cookie consent">
            <div className="landing-cookie__inner">
                <div className="landing-cookie__main">
                    <p className="landing-cookie__text">{copy.cookies.message}</p>
                    <label className="landing-cookie__pdn">
                        <input
                            type="checkbox"
                            checked={pdnConsent}
                            onChange={(e) => {
                                setPdnConsent(e.target.checked);
                                setError(null);
                            }}
                        />
                        <span>{copy.cookies.pdnLabel}</span>
                    </label>
                    {error && <p className="landing-lead-form__error">{error}</p>}
                </div>
                <div className="landing-cookie__actions">
                    <button type="button" className="landing-cookie__btn landing-cookie__btn--accept" onClick={accept}>
                        {copy.cookies.accept}
                    </button>
                    <button
                        type="button"
                        className="landing-cookie__btn landing-cookie__btn--link"
                        onClick={onLearnMore}
                    >
                        {copy.cookies.learnMore}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
