import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, KeyRound, Lock, Mail, Phone, UserPlus, X } from 'lucide-react';
import {
    authApi,
    getRegisterFamilyOfficeErrorMessage,
    getVerifyFamilyOfficeRegistrationErrorMessage,
    type FamilyOfficeSelfRegisterStep1Request,
} from '../../api/authApi';
import {
    DEFAULT_FO_BROKER_OPTION_ID,
    FAMILY_OFFICE_BROKER_OPTIONS,
    getDefaultFamilyOfficeBrokerOption,
    type FamilyOfficeBrokerOption,
} from '../../config/familyOfficeBrokerOptions';
import { useAgentProfileOptional } from '../../context/AgentProfileContext';
import type { LandingLang } from '../../content/landingCopy';
import type { LandingVariant } from '../../content/landingAssets';
import { getTrackingContext, trackLandingEvent } from '../../utils/landingAnalytics';
import {
    captureFamilyOfficeSelfRegisterAttributionFromUrl,
    getFamilyOfficeSelfRegisterAttribution,
} from '../../utils/familyOfficeSelfRegisterAttribution';
import {
    formatRussianPhoneInput,
    getPhoneInputCaretPosition,
    hasCompleteRussianPhone,
    PHONE_MASK_TEMPLATE,
    PHONE_PLACEHOLDER,
} from '../../utils/phone';
import '../FamilyOfficeInviteModal.css';
import '../../styles/landing.css';

type WizardStep = 'broker' | 'form' | 'verify' | 'submitting';

export type FoRegisterOpenSource = 'hero' | 'sticky' | 'final' | 'deeplink' | 'manual';

interface FamilyOfficeSelfRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: LandingLang;
    variant: LandingVariant;
    openSource?: FoRegisterOpenSource;
}

function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

const FamilyOfficeSelfRegisterModal: React.FC<FamilyOfficeSelfRegisterModalProps> = ({
    isOpen,
    onClose,
    lang,
    variant,
    openSource = 'manual',
}) => {
    const agentProfile = useAgentProfileOptional();
    const defaultBroker = getDefaultFamilyOfficeBrokerOption();

    const [step, setStep] = useState<WizardStep>('broker');
    const [selectedBrokerId, setSelectedBrokerId] = useState(DEFAULT_FO_BROKER_OPTION_ID);
    const [pendingEmail, setPendingEmail] = useState('');
    const [expiresMinutes, setExpiresMinutes] = useState<number | null>(null);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [phone, setPhone] = useState(PHONE_MASK_TEMPLATE);
    const [gender, setGender] = useState<'male' | 'female' | ''>('');

    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');

    const [error, setError] = useState<string | null>(null);

    const trackFo = useCallback(
        (event: 'fo_register_open' | 'fo_register_step' | 'fo_register_success', extra?: Record<string, string>) => {
            const ctx = getTrackingContext(lang, variant);
            trackLandingEvent('cta_click', ctx, {
                fo_event: event,
                fo_source: openSource,
                ...extra,
            });
        },
        [lang, variant, openSource],
    );

    const resetWizard = useCallback(() => {
        setStep('broker');
        setSelectedBrokerId(DEFAULT_FO_BROKER_OPTION_ID);
        setPendingEmail('');
        setExpiresMinutes(null);
        setEmail('');
        setFirstName('');
        setLastName('');
        setMiddleName('');
        setPhone(PHONE_MASK_TEMPLATE);
        setGender('');
        setCode('');
        setPassword('');
        setPasswordRepeat('');
        setError(null);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        resetWizard();
        trackFo('fo_register_open');
    }, [isOpen, resetWizard, trackFo]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && step !== 'verify') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, step, onClose]);

    const selectedBroker: FamilyOfficeBrokerOption =
        FAMILY_OFFICE_BROKER_OPTIONS.find((o) => o.id === selectedBrokerId) ?? defaultBroker;

    const handleOverlayClick = () => {
        if (step === 'verify') return;
        onClose();
    };

    const handleBrokerContinue = () => {
        const broker = FAMILY_OFFICE_BROKER_OPTIONS.find((o) => o.id === selectedBrokerId);
        if (!broker?.available || !broker.project_key) {
            setError('Выберите доступный пакет партнёров');
            return;
        }
        setError(null);
        captureFamilyOfficeSelfRegisterAttributionFromUrl(window.location.search, broker.project_key);
        trackFo('fo_register_step', { fo_step: 'broker' });
        setStep('form');
    };

    const buildRegisterBody = (): FamilyOfficeSelfRegisterStep1Request | null => {
        const broker = FAMILY_OFFICE_BROKER_OPTIONS.find((o) => o.id === selectedBrokerId);
        if (!broker?.project_key) return null;

        const attribution = getFamilyOfficeSelfRegisterAttribution(broker.project_key);
        const body: FamilyOfficeSelfRegisterStep1Request = {
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone,
            gender: gender as 'male' | 'female',
            project_key: attribution.project_key,
        };
        if (middleName.trim()) body.middle_name = middleName.trim();
        if (attribution.utm_source) body.utm_source = attribution.utm_source;
        if (attribution.utm_medium) body.utm_medium = attribution.utm_medium;
        if (attribution.utm_campaign) body.utm_campaign = attribution.utm_campaign;
        if (attribution.utm_content) body.utm_content = attribution.utm_content;
        if (attribution.utm_term) body.utm_term = attribution.utm_term;
        return body;
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidEmail(email)) {
            setError('Введите корректный email');
            return;
        }
        if (!firstName.trim() || !lastName.trim()) {
            setError('Укажите имя и фамилию');
            return;
        }
        if (!hasCompleteRussianPhone(phone)) {
            setError('Введите телефон полностью в формате +7(___)___-__-__');
            return;
        }
        if (gender !== 'male' && gender !== 'female') {
            setError('Укажите пол');
            return;
        }

        const body = buildRegisterBody();
        if (!body) {
            setError('Выберите пакет партнёров');
            setStep('broker');
            return;
        }

        setStep('submitting');
        try {
            const res = await authApi.registerFamilyOffice(body);
            setPendingEmail(body.email);
            setExpiresMinutes(res.expires_in_minutes ?? 10);
            setCode('');
            setPassword('');
            setPasswordRepeat('');
            trackFo('fo_register_step', { fo_step: 'form' });
            setStep('verify');
        } catch (err) {
            setError(getRegisterFamilyOfficeErrorMessage(err));
            setStep('form');
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const normalizedCode = code.replace(/\D/g, '');
        if (normalizedCode.length !== 6) {
            setError('Введите 6-значный код из письма');
            return;
        }
        if (password.length < 6) {
            setError('Пароль не короче 6 символов');
            return;
        }
        if (password !== passwordRepeat) {
            setError('Пароли не совпадают');
            return;
        }

        setStep('submitting');
        try {
            const res = await authApi.verifyFamilyOfficeRegistration(
                pendingEmail,
                normalizedCode,
                password,
            );
            agentProfile?.applyProfileFromAuth(res);
            trackFo('fo_register_success');
            const url = new URL(window.location.origin);
            url.pathname = '/';
            url.search = '';
            window.location.replace(url.toString());
        } catch (err) {
            setError(getVerifyFamilyOfficeRegistrationErrorMessage(err));
            setStep('verify');
        }
    };

    const showForm = step === 'form' || (step === 'submitting' && !pendingEmail);
    const showVerify = step === 'verify' || (step === 'submitting' && Boolean(pendingEmail));

    const title = showVerify
        ? 'Подтверждение email'
        : step === 'broker'
          ? 'Открыть Family Office'
          : 'Регистрация Family Office';

    const subtitle = showVerify
        ? `Код отправлен на ${pendingEmail}${expiresMinutes ? ` · действует ~${expiresMinutes} мин` : ''}`
        : step === 'broker'
          ? 'Выберите базовый пакет партнёров для вашего офиса'
          : `${selectedBroker.label} — заполните анкету`;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fo-invite-overlay landing-fo-register-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className="fo-invite-modal landing-fo-register-modal"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="fo-self-register-title"
                    >
                        {step !== 'verify' && (
                            <button
                                type="button"
                                className="fo-invite-modal__close"
                                onClick={onClose}
                                aria-label="Закрыть"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <header className="fo-invite-modal__header">
                            <motion.div
                                className="fo-invite-modal__icon"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                <UserPlus size={22} />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                                <h2 id="fo-self-register-title" className="fo-invite-modal__title">
                                    {title}
                                </h2>
                                <p className="fo-invite-modal__subtitle">{subtitle}</p>
                            </motion.div>
                        </header>

                        {error && (
                            <motion.div
                                className="fo-invite-alert fo-invite-alert--error"
                                style={{ marginBottom: '16px' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {step === 'broker' && (
                            <>
                                <motion.div
                                    className="landing-fo-broker-grid"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {FAMILY_OFFICE_BROKER_OPTIONS.map((option) => {
                                        const isSelected =
                                            option.available && selectedBrokerId === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={`landing-fo-broker-card${isSelected ? ' landing-fo-broker-card--selected' : ''}${!option.available ? ' landing-fo-broker-card--disabled' : ''}`}
                                                disabled={!option.available}
                                                onClick={() => {
                                                    if (!option.available) return;
                                                    setSelectedBrokerId(option.id);
                                                    setError(null);
                                                }}
                                            >
                                                {!option.available && (
                                                    <span className="landing-fo-broker-card__badge">
                                                        Скоро
                                                    </span>
                                                )}
                                                <span className="landing-fo-broker-card__label">
                                                    {option.label}
                                                </span>
                                                <span className="landing-fo-broker-card__subtitle">
                                                    {option.subtitle}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                                <button
                                    type="button"
                                    className="fo-invite-modal__submit"
                                    onClick={handleBrokerContinue}
                                >
                                    Продолжить
                                </button>
                            </>
                        )}

                        {showForm && (
                            <form onSubmit={handleRegisterSubmit}>
                                <button
                                    type="button"
                                    className="landing-fo-register-back"
                                    onClick={() => {
                                        setError(null);
                                        setStep('broker');
                                    }}
                                >
                                    <ChevronLeft size={16} aria-hidden />
                                    Назад к выбору пакета
                                </button>

                                <div className="fo-invite-modal__grid-2">
                                    <motion.div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-reg-first">
                                            Имя
                                        </label>
                                        <input
                                            id="fo-reg-first"
                                            type="text"
                                            className="fo-invite-field"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            autoComplete="given-name"
                                        />
                                    </motion.div>
                                    <motion.div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-reg-last">
                                            Фамилия
                                        </label>
                                        <input
                                            id="fo-reg-last"
                                            type="text"
                                            className="fo-invite-field"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            autoComplete="family-name"
                                        />
                                    </motion.div>
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-reg-middle">
                                        Отчество (необязательно)
                                    </label>
                                    <input
                                        id="fo-reg-middle"
                                        type="text"
                                        className="fo-invite-field"
                                        value={middleName}
                                        onChange={(e) => setMiddleName(e.target.value)}
                                        autoComplete="additional-name"
                                    />
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-reg-phone">
                                        Телефон
                                    </label>
                                    <motion.div className="fo-invite-field-wrap">
                                        <Phone className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            id="fo-reg-phone"
                                            type="tel"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(formatRussianPhoneInput(e.target.value))
                                            }
                                            onFocus={(e) => {
                                                const nextPos = getPhoneInputCaretPosition(
                                                    e.target.value,
                                                );
                                                requestAnimationFrame(() => {
                                                    e.target.setSelectionRange(nextPos, nextPos);
                                                });
                                            }}
                                            placeholder={PHONE_PLACEHOLDER}
                                            required
                                        />
                                    </motion.div>
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-reg-gender">
                                        Пол
                                    </label>
                                    <select
                                        id="fo-reg-gender"
                                        className="fo-invite-field fo-invite-field--select"
                                        value={gender}
                                        onChange={(e) =>
                                            setGender(e.target.value as 'male' | 'female' | '')
                                        }
                                        required
                                    >
                                        <option value="">Выберите</option>
                                        <option value="male">Мужской</option>
                                        <option value="female">Женский</option>
                                    </select>
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-reg-email">
                                        Email
                                    </label>
                                    <div className="fo-invite-field-wrap">
                                        <Mail className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            id="fo-reg-email"
                                            type="email"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="agent@example.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="fo-invite-modal__submit"
                                    disabled={step === 'submitting'}
                                >
                                    {step === 'submitting' ? 'Отправка…' : 'Получить код на email'}
                                </button>
                            </form>
                        )}

                        {showVerify && (
                            <form onSubmit={handleVerifySubmit}>
                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-reg-code">
                                        Код из письма
                                    </label>
                                    <div className="fo-invite-field-wrap">
                                        <KeyRound className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            id="fo-reg-code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={code}
                                            onChange={(e) =>
                                                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                            }
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <motion.div className="fo-invite-group">
                                    <label className="label">Пароль</label>
                                    <motion.div className="fo-invite-field-wrap">
                                        <Lock className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            type="password"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Не менее 6 символов"
                                            minLength={6}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </motion.div>
                                </motion.div>

                                <motion.div className="fo-invite-group">
                                    <label className="label">Повторите пароль</label>
                                    <motion.div className="fo-invite-field-wrap">
                                        <Lock className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            type="password"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={passwordRepeat}
                                            onChange={(e) => setPasswordRepeat(e.target.value)}
                                            placeholder="Ещё раз"
                                            minLength={6}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </motion.div>
                                </motion.div>

                                <button
                                    type="submit"
                                    className="fo-invite-modal__submit"
                                    disabled={step === 'submitting'}
                                >
                                    {step === 'submitting'
                                        ? 'Регистрация…'
                                        : 'Зарегистрироваться и войти'}
                                </button>

                                <button
                                    type="button"
                                    className="fo-invite-modal__submit landing-fo-register-secondary-btn"
                                    disabled={step === 'submitting'}
                                    onClick={() => {
                                        setStep('form');
                                        setError(null);
                                    }}
                                >
                                    Изменить email
                                </button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FamilyOfficeSelfRegisterModal;
