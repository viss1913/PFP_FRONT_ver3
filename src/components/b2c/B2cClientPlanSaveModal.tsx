import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Loader2 } from 'lucide-react';
import { b2cApi, getGuestCalculateErrorMessage, parseGuestCalculateLead } from '../../api/b2cApi';
import type { ClientB2cAttribution } from '../../utils/clientB2cAttribution';
import { setGuestPlanSession } from '../../utils/clientB2cAuth';
import { loadB2cPlanDraft, saveB2cPlanDraft } from '../../utils/b2cPlanDraft';
import type { GuestCalculatePayload } from '../../utils/b2cGuestCalculatePayload';
import '../FamilyOfficeInviteModal.css';

function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

interface B2cClientPlanSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    attribution: ClientB2cAttribution;
    inviterName?: string;
    onSuccess: (result: unknown) => void;
}

const B2cClientPlanSaveModal: React.FC<B2cClientPlanSaveModalProps> = ({
    isOpen,
    onClose,
    attribution,
    inviterName,
    onSuccess,
}) => {
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subtitle = useMemo(() => {
        if (inviterName) {
            return `Укажите email — сохраним план и покажем отчёт. Вас пригласил ${inviterName}.`;
        }
        return 'Укажите email — сохраним план в CRM консультанта и откроем отчёт.';
    }, [inviterName]);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSaving(false);
        const draftEmail = (loadB2cPlanDraft()?.email || '').trim();
        setEmail(draftEmail);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) onClose();
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose, saving]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const ref = attribution.ref?.trim();
        if (!ref) {
            setError('Нет ссылки приглашения (ref). Откройте страницу по ссылке от консультанта.');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Введите корректный email');
            return;
        }

        const draft = loadB2cPlanDraft();
        if (!draft?.firstRunPayload) {
            setError('Нет данных плана. Пройдите анкету заново.');
            return;
        }

        const basePayload = draft.firstRunPayload;
        const payload: GuestCalculatePayload = {
            ...basePayload,
            ref,
            client: {
                ...basePayload.client,
                email: email.trim(),
            },
        };

        setSaving(true);
        try {
            const result = await b2cApi.guestCalculate(attribution.project_key, payload);
            const lead = parseGuestCalculateLead(result, email.trim());
            if (!lead) {
                setError('План рассчитан, но не сохранён. Проверьте email и ссылку приглашения.');
                return;
            }

            setGuestPlanSession({
                guest_token: lead.guest_token,
                client_id: lead.client_id,
                email: email.trim(),
            });

            const calculationResult = {
                ...result,
                client_id: lead.client_id,
                plan_saved: lead.plan_saved,
            };

            saveB2cPlanDraft({
                ...draft,
                firstRunPayload: payload,
                email: email.trim(),
                guestToken: lead.guest_token,
                clientId: lead.client_id,
                planSaved: true,
                calculationResult,
                savedAt: new Date().toISOString(),
            });

            onSuccess(calculationResult);
            onClose();
        } catch (err) {
            setError(getGuestCalculateErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fo-invite-overlay b2c-register-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={saving ? undefined : onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="fo-invite-modal b2c-register-modal"
                    role="dialog"
                    aria-labelledby="b2c-plan-save-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="fo-invite-modal__close"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Закрыть"
                    >
                        <X size={18} />
                    </button>

                    <header className="fo-invite-modal__header">
                        <div className="fo-invite-modal__icon b2c-register-modal__icon">
                            <Mail size={22} />
                        </div>
                        <div>
                            <h2 id="b2c-plan-save-title" className="fo-invite-modal__title">
                                Сохранить план
                            </h2>
                            <p className="fo-invite-modal__subtitle">{subtitle}</p>
                        </div>
                    </header>

                    {error ? (
                        <div className="fo-invite-alert fo-invite-alert--error">{error}</div>
                    ) : null}

                    {saving ? (
                        <div className="b2c-register-modal__loading">
                            <Loader2 size={28} className="b2c-register-modal__spinner" />
                            <p>Сохраняем план и готовим отчёт…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="fo-invite-group">
                                <label className="label" htmlFor="b2c-plan-save-email">
                                    Email
                                </label>
                                <div className="fo-invite-field-wrap">
                                    <Mail className="fo-invite-field-wrap__icon" size={18} />
                                    <input
                                        id="b2c-plan-save-email"
                                        type="email"
                                        className="fo-invite-field fo-invite-field--icon"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <p className="b2c-register-modal__hint">
                                Пароль не нужен — после сохранения сразу откроется отчёт. Регистрацию с паролем
                                можно пройти позже.
                            </p>
                            <button type="submit" className="fo-invite-modal__submit b2c-register-modal__submit">
                                Сохранить и открыть отчёт
                            </button>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default B2cClientPlanSaveModal;
