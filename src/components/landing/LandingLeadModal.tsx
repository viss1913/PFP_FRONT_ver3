import React, { useState } from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import type { LeadType } from '../../utils/landingLeads';
import { submitLandingLead } from '../../utils/landingLeads';
import { getTrackingContext, trackLandingEvent } from '../../utils/landingAnalytics';
import type { LandingLang } from '../../content/landingCopy';
import type { LandingVariant } from '../../content/landingAssets';
import { useLandingActions } from '../../context/LandingActionsContext';

interface LandingLeadModalProps {
    copy: LandingCopy;
    lang: LandingLang;
    variant: LandingVariant;
    type: LeadType | null;
    onClose: () => void;
}

const LandingLeadModal: React.FC<LandingLeadModalProps> = ({ copy, lang, variant, type, onClose }) => {
    const { onLoginWithIntent } = useLandingActions();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!type) return null;

    const formCopy =
        type === 'general'
            ? copy.leadForm.general
            : type === 'client'
              ? copy.leadForm.client
              : copy.leadForm.consultant;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consent) {
            setError(copy.leadForm.consentRequired);
            return;
        }
        setLoading(true);
        setError(null);
        const result = await submitLandingLead({
            type,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            consent: true,
            lang,
            variant,
        });
        setLoading(false);
        if (result.ok) {
            trackLandingEvent('lead_submit', getTrackingContext(lang, variant), { type });
            setDone(true);
        } else {
            setError(copy.leadForm.error);
        }
    };

    return (
        <div className="landing-modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="landing-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="landing-lead-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="landing-modal__close" onClick={onClose} aria-label="Close">
                    ×
                </button>
                {done ? (
                    <div className="landing-modal__success">
                        <h2 id="landing-lead-title">{copy.leadForm.successTitle}</h2>
                        <p>{copy.leadForm.successMessage}</p>
                        <button type="button" className="landing-btn landing-btn--primary" onClick={onClose}>
                            OK
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 id="landing-lead-title">{formCopy.title}</h2>
                        <p className="landing-modal__subtitle">{formCopy.subtitle}</p>
                        <form className="landing-lead-form" onSubmit={handleSubmit}>
                            <label>
                                {copy.leadForm.nameLabel}
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </label>
                            <label>
                                {copy.leadForm.phoneLabel}
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoComplete="tel"
                                />
                            </label>
                            <label>
                                {copy.leadForm.emailLabel}
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </label>
                            <label className="landing-lead-form__consent">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                />
                                <span>{copy.leadForm.consentLabel}</span>
                            </label>
                            {error && <p className="landing-lead-form__error">{error}</p>}
                            <button
                                type="submit"
                                className="landing-btn landing-btn--primary"
                                disabled={loading}
                            >
                                {loading ? copy.leadForm.submitting : formCopy.submit}
                            </button>
                        </form>
                        <p className="landing-modal__login-hint">
                            {copy.leadForm.hasAccount}{' '}
                            <button
                                type="button"
                                className="landing-modal__link"
                                onClick={() => {
                                    onClose();
                                    onLoginWithIntent(type === 'general' ? undefined : type);
                                }}
                            >
                                {copy.leadForm.loginLink}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LandingLeadModal;
