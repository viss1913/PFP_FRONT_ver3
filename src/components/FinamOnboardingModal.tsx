import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import avatarImage from '../assets/avatar_full.png';
import { useAgentProfile } from '../context/AgentProfileContext';
import './FinamOnboardingModal.css';

const FinamOnboardingModal: React.FC = () => {
    const {
        profile,
        loading,
        shouldShowFinamOnboarding,
        finamModalStep,
        goToFinamRegistration,
        skipFinamOnboarding,
        submitPartnerId,
        closeManualWizard,
        manualWizardOpen,
    } = useAgentProfile();

    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const isOpen = shouldShowFinamOnboarding && finamModalStep != null;
    const label = profile?.partner_agent_id_label ?? 'Finam ID';
    const hasParent = profile?.parent_agent_id != null;
    const finamUrl = profile?.finam_agent_registration_url;

    const skipLabel = hasParent ? 'Работать под ID куратора' : 'Пропустить';

    const handleSkip = async () => {
        setError(null);
        try {
            await skipFinamOnboarding();
            if (manualWizardOpen) {
                closeManualWizard();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось пропустить');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await submitPartnerId(inputValue);
            setInputValue('');
            if (manualWizardOpen) {
                closeManualWizard();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось сохранить');
        }
    };

    const referralUrl = profile?.finam_agent_referral_url;

    const handleCopyReferral = async () => {
        if (!referralUrl) return;
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Не удалось скопировать ссылку');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="finam-onboard-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        className="finam-onboard-modal"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            key={finamModalStep ?? 'pitch'}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div className="finam-onboard-hero">
                                <div className="finam-onboard-avatar">
                                    <img src={avatarImage} alt="AI Assistant" />
                                </div>
                                <div className="finam-onboard-bubble">
                                    {finamModalStep === 'pitch' ? (
                                        <>
                                            Предлагаю зарегистрироваться агентом Финама — это откроет
                                            полный доступ к кабинету. Комиссия до 30%.
                                        </>
                                    ) : (
                                        <>
                                            После регистрации вы получите реферальную ссылку с вашим
                                            ID. Вставьте эту ссылку в поле ниже.
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {error && <div className="finam-onboard-error">{error}</div>}

                            {finamModalStep === 'pitch' && (
                                <div className="finam-onboard-actions">
                                    <button
                                        type="button"
                                        className="finam-onboard-btn finam-onboard-btn--primary"
                                        disabled={!finamUrl || loading}
                                        onClick={goToFinamRegistration}
                                    >
                                        Зарегистрироваться на Финаме
                                    </button>
                                    <button
                                        type="button"
                                        className="finam-onboard-btn finam-onboard-btn--secondary"
                                        disabled={loading}
                                        onClick={() => void handleSkip()}
                                    >
                                        {skipLabel}
                                    </button>
                                </div>
                            )}

                            {manualWizardOpen && (
                                <div style={{ marginBottom: 12, textAlign: 'right' }}>
                                    <button
                                        type="button"
                                        className="finam-onboard-btn finam-onboard-btn--ghost"
                                        style={{ width: 'auto', padding: '8px 12px' }}
                                        onClick={closeManualWizard}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            )}

                            {finamModalStep === 'paste-link' && (
                                <form onSubmit={(e) => void handleSubmit(e)}>
                                    <div className="finam-onboard-field">
                                        <label htmlFor="finam-partner-input">{label}</label>
                                        <input
                                            id="finam-partner-input"
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Ссылка или ID из личного кабинета Финама"
                                            disabled={loading}
                                            autoComplete="off"
                                        />
                                    </div>

                                    {referralUrl && profile?.has_partner_full_access && (
                                        <div className="finam-onboard-referral">
                                            <div style={{ marginBottom: 8 }}>Ваша реферальная ссылка:</div>
                                            <div style={{ marginBottom: 8 }}>{referralUrl}</div>
                                            <button
                                                type="button"
                                                className="finam-onboard-btn finam-onboard-btn--secondary"
                                                onClick={() => void handleCopyReferral()}
                                            >
                                                {copied ? 'Скопировано' : 'Скопировать'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="finam-onboard-actions">
                                        <button
                                            type="submit"
                                            className="finam-onboard-btn finam-onboard-btn--primary"
                                            disabled={loading || !inputValue.trim()}
                                        >
                                            {loading ? 'Сохранение…' : 'Сохранить'}
                                        </button>
                                        <button
                                            type="button"
                                            className="finam-onboard-btn finam-onboard-btn--ghost"
                                            disabled={loading}
                                            onClick={() => void handleSkip()}
                                        >
                                            {skipLabel}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FinamOnboardingModal;
