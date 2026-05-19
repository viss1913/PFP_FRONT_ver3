import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, UserPlus, Lock, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    authApi,
    getRegisterAgentErrorMessage,
    getVerifyAgentRegistrationErrorMessage,
    type AgentRegisterStep1Request,
} from '../../api/authApi';
import {
    captureAgentRegisterAttributionFromUrl,
    getAgentRegisterAttribution,
    type AgentRegisterAttribution,
} from '../../utils/agentRegisterAttribution';
import {
    formatRussianPhoneInput,
    PHONE_MASK_TEMPLATE,
    PHONE_PLACEHOLDER,
    getPhoneInputCaretPosition,
    hasCompleteRussianPhone,
} from '../../utils/phone';
import '../../components/FamilyOfficeInviteModal.css';

type Step = 'form' | 'verify' | 'submitting';

function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

function buildRegisterBody(
    attribution: AgentRegisterAttribution,
    form: {
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        partner_agent_id: string;
    },
): AgentRegisterStep1Request {
    const body: AgentRegisterStep1Request = {
        email: form.email.trim(),
        project_key: attribution.project_key,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone,
    };
    if (attribution.ref) body.ref = attribution.ref;
    if (attribution.utm_source) body.utm_source = attribution.utm_source;
    if (attribution.utm_medium) body.utm_medium = attribution.utm_medium;
    if (attribution.utm_campaign) body.utm_campaign = attribution.utm_campaign;
    if (attribution.utm_content) body.utm_content = attribution.utm_content;
    if (attribution.utm_term) body.utm_term = attribution.utm_term;
    if (attribution.utm_partner_finam) body.utm_partner_finam = attribution.utm_partner_finam;
    const ownFinamId = form.partner_agent_id.trim();
    if (ownFinamId) body.partner_agent_id = ownFinamId;
    return body;
}

const AgentRegisterPage: React.FC = () => {
    const [attribution, setAttribution] = useState<AgentRegisterAttribution>(() =>
        getAgentRegisterAttribution(),
    );
    const [step, setStep] = useState<Step>('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [expiresMinutes, setExpiresMinutes] = useState<number | null>(null);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState(PHONE_MASK_TEMPLATE);
    const [partnerAgentId, setPartnerAgentId] = useState('');

    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');

    const [error, setError] = useState<string | null>(null);

    const missingRef = useMemo(() => !attribution.ref, [attribution.ref]);

    useEffect(() => {
        const captured = captureAgentRegisterAttributionFromUrl();
        setAttribution(captured);
    }, []);

    const redirectToLk = () => {
        const url = new URL(window.location.origin);
        url.pathname = '/';
        url.search = '';
        window.location.replace(url.toString());
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatRussianPhoneInput(e.target.value));
    };

    const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const nextPos = getPhoneInputCaretPosition(e.target.value);
        requestAnimationFrame(() => {
            e.target.setSelectionRange(nextPos, nextPos);
        });
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

        setStep('submitting');
        try {
            const body = buildRegisterBody(attribution, {
                email,
                first_name: firstName,
                last_name: lastName,
                phone,
                partner_agent_id: partnerAgentId,
            });
            const res = await authApi.registerAgent(body);
            setPendingEmail(body.email);
            setExpiresMinutes(res.expires_in_minutes ?? 10);
            setCode('');
            setPassword('');
            setPasswordRepeat('');
            setStep('verify');
        } catch (err) {
            setError(getRegisterAgentErrorMessage(err));
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
            const res = await authApi.verifyAgentRegistration(
                pendingEmail,
                normalizedCode,
                password,
            );
            localStorage.setItem('token', res.token);
            if (res.user) {
                localStorage.setItem('user', JSON.stringify(res.user));
            }
            redirectToLk();
        } catch (err) {
            setError(getVerifyAgentRegistrationErrorMessage(err));
            setStep('verify');
        }
    };

    return (
        <div className="fo-invite-overlay" style={{ position: 'fixed', minHeight: '100vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="fo-invite-modal"
                style={{ maxWidth: '520px' }}
                role="dialog"
                aria-labelledby="agent-register-title"
            >
                <header className="fo-invite-modal__header">
                    <motion.div
                        className="fo-invite-modal__icon"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                    >
                        <UserPlus size={22} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 id="agent-register-title" className="fo-invite-modal__title">
                            {step === 'verify' ? 'Подтверждение email' : 'Регистрация агента'}
                        </h1>
                        <p className="fo-invite-modal__subtitle">
                            {step === 'verify'
                                ? `Код отправлен на ${pendingEmail}${
                                      expiresMinutes ? ` · действует ~${expiresMinutes} мин` : ''
                                  }`
                                : 'Заполните данные — привязка к куратору по ссылке из приглашения'}
                        </p>
                    </motion.div>
                </header>

                {missingRef && step === 'form' && (
                    <div className="fo-invite-alert fo-invite-alert--error" style={{ marginBottom: '16px' }}>
                        В ссылке нет ref — субагент может не привязаться к куратору. Откройте страницу из
                        письма или запросите новую ссылку.
                    </div>
                )}

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

                {step === 'form' || (step === 'submitting' && !pendingEmail) ? (
                    <form onSubmit={handleRegisterSubmit}>
                        <motion.div
                            className="fo-invite-group"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <label className="label" htmlFor="agent-reg-email">
                                Email
                            </label>
                            <div className="fo-invite-field-wrap">
                                <Mail className="fo-invite-field-wrap__icon" size={18} />
                                <input
                                    id="agent-reg-email"
                                    type="email"
                                    className="fo-invite-field fo-invite-field--icon"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </motion.div>

                        <div className="fo-invite-modal__grid-2">
                            <div className="fo-invite-group">
                                <label className="label" htmlFor="agent-reg-first">
                                    Имя
                                </label>
                                <input
                                    id="agent-reg-first"
                                    type="text"
                                    className="fo-invite-field"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="fo-invite-group">
                                <label className="label" htmlFor="agent-reg-last">
                                    Фамилия
                                </label>
                                <input
                                    id="agent-reg-last"
                                    type="text"
                                    className="fo-invite-field"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fo-invite-group">
                            <label className="label" htmlFor="agent-reg-phone">
                                Телефон
                            </label>
                            <div className="fo-invite-field-wrap">
                                <Phone className="fo-invite-field-wrap__icon" size={18} />
                                <input
                                    id="agent-reg-phone"
                                    type="tel"
                                    className="fo-invite-field fo-invite-field--icon"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    onFocus={handlePhoneFocus}
                                    placeholder={PHONE_PLACEHOLDER}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fo-invite-group">
                            <label className="label" htmlFor="agent-reg-finam">
                                Finam ID (необязательно)
                            </label>
                            <input
                                id="agent-reg-finam"
                                type="text"
                                className="fo-invite-field"
                                value={partnerAgentId}
                                onChange={(e) => setPartnerAgentId(e.target.value)}
                                placeholder="Можно указать позже в кабинете"
                            />
                        </div>

                        <button
                            type="submit"
                            className="fo-invite-modal__submit"
                            disabled={step === 'submitting'}
                        >
                            {step === 'submitting' ? 'Отправка…' : 'Получить код на email'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifySubmit}>
                        <div className="fo-invite-group">
                            <label className="label" htmlFor="agent-reg-code">
                                Код из письма
                            </label>
                            <div className="fo-invite-field-wrap">
                                <KeyRound className="fo-invite-field-wrap__icon" size={18} />
                                <input
                                    id="agent-reg-code"
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
                            <div className="fo-invite-field-wrap">
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
                            </div>
                        </motion.div>

                        <div className="fo-invite-group">
                            <label className="label">Повторите пароль</label>
                            <div className="fo-invite-field-wrap">
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
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="fo-invite-modal__submit"
                            disabled={step === 'submitting'}
                        >
                            {step === 'submitting' ? 'Регистрация…' : 'Зарегистрироваться и войти'}
                        </button>

                        <button
                            type="button"
                            className="fo-invite-modal__submit"
                            style={{
                                marginTop: '10px',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'none',
                            }}
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
        </div>
    );
};

export default AgentRegisterPage;
