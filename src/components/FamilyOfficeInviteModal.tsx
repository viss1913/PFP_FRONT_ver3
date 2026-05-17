import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, User, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    agentLkApi,
    getFamilyOfficeInviteErrorMessage,
    type FamilyOfficeInviteRequest,
    type FamilyOfficeInviteResponse,
} from '../api/agentLkApi';
import {
    formatRussianPhoneInput,
    PHONE_MASK_TEMPLATE,
    PHONE_PLACEHOLDER,
    getPhoneInputCaretPosition,
    hasCompleteRussianPhone,
} from '../utils/phone';
import './FamilyOfficeInviteModal.css';

interface FamilyOfficeInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialValues?: Partial<FamilyOfficeInviteRequest>;
    onSuccess?: (res: FamilyOfficeInviteResponse) => void;
}

type InviteFormState = FamilyOfficeInviteRequest & {
    birth_date?: string;
    gender?: string;
    source_note?: string;
};

const EMPTY_FORM: InviteFormState = {
    email: '',
    first_name: '',
    last_name: '',
    phone: PHONE_MASK_TEMPLATE,
    birth_date: '',
    gender: '',
    source_note: '',
};

function mergeInitialValues(
    initial?: Partial<FamilyOfficeInviteRequest>,
): InviteFormState {
    if (!initial) return { ...EMPTY_FORM };
    return {
        ...EMPTY_FORM,
        ...initial,
        phone: initial.phone
            ? formatRussianPhoneInput(initial.phone)
            : PHONE_MASK_TEMPLATE,
    };
}

function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

const FamilyOfficeInviteModal: React.FC<FamilyOfficeInviteModalProps> = ({
    isOpen,
    onClose,
    initialValues,
    onSuccess,
}) => {
    const [form, setForm] = useState<InviteFormState>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<FamilyOfficeInviteResponse | null>(null);

    useEffect(() => {
        if (isOpen) {
            setForm(mergeInitialValues(initialValues));
            setError(null);
            setSuccess(null);
            setLoading(false);
        }
    }, [isOpen, initialValues]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, phone: formatRussianPhoneInput(e.target.value) }));
    };

    const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const nextPos = getPhoneInputCaretPosition(e.target.value);
        requestAnimationFrame(() => {
            e.target.setSelectionRange(nextPos, nextPos);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidEmail(form.email)) {
            setError('Введите корректный email');
            return;
        }
        if (!form.first_name.trim() || !form.last_name.trim()) {
            setError('Укажите имя и фамилию');
            return;
        }
        if (!hasCompleteRussianPhone(form.phone)) {
            setError('Введите телефон полностью в формате +7(___)___-__-__');
            return;
        }
        if (form.birth_date) {
            const birth = new Date(form.birth_date);
            if (birth > new Date()) {
                setError('Дата рождения не может быть в будущем');
                return;
            }
        }

        setLoading(true);
        try {
            const body: FamilyOfficeInviteRequest = {
                email: form.email,
                first_name: form.first_name,
                last_name: form.last_name,
                phone: form.phone,
            };
            if (form.birth_date?.trim()) body.birth_date = form.birth_date.trim();
            if (form.gender === 'male' || form.gender === 'female') body.gender = form.gender;
            if (form.source_note?.trim()) body.source_note = form.source_note.trim();

            const res = await agentLkApi.sendFamilyOfficeInvite(body);
            setSuccess(res);
            onSuccess?.(res);
        } catch (err) {
            setError(getFamilyOfficeInviteErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const formatExpiresAt = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fo-invite-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="fo-invite-modal"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="fo-invite-modal__close"
                            onClick={onClose}
                            aria-label="Закрыть"
                        >
                            <X size={20} />
                        </button>

                        <header className="fo-invite-modal__header">
                            <div className="fo-invite-modal__icon">
                                <UserPlus size={24} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="fo-invite-modal__title">Пригласить в Family Office</h2>
                                <p className="fo-invite-modal__subtitle">
                                    Субагент получит письмо со ссылкой для активации аккаунта.
                                </p>
                            </div>
                        </header>

                        {success ? (
                            <>
                                <div className="fo-invite-alert fo-invite-alert--success">
                                    <p style={{ margin: 0, fontWeight: 600 }}>Письмо отправлено</p>
                                    <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
                                        На <strong>{success.email}</strong>
                                        {success.expires_at && (
                                            <> · действует до {formatExpiresAt(success.expires_at)}</>
                                        )}
                                    </p>
                                </div>
                                <button type="button" className="btn-primary" onClick={onClose}>
                                    Закрыть
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="fo-invite-alert fo-invite-alert--error">{error}</div>
                                )}

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-invite-email">
                                        Email
                                    </label>
                                    <div className="fo-invite-field-wrap">
                                        <Mail className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            id="fo-invite-email"
                                            type="email"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, email: e.target.value }))
                                            }
                                            placeholder="ivan@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="fo-invite-modal__grid-2">
                                    <div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-invite-first">
                                            Имя
                                        </label>
                                        <div className="fo-invite-field-wrap">
                                            <User className="fo-invite-field-wrap__icon" size={18} />
                                            <input
                                                id="fo-invite-first"
                                                type="text"
                                                className="fo-invite-field fo-invite-field--icon"
                                                value={form.first_name}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        first_name: e.target.value,
                                                    }))
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-invite-last">
                                            Фамилия
                                        </label>
                                        <input
                                            id="fo-invite-last"
                                            type="text"
                                            className="fo-invite-field"
                                            value={form.last_name}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    last_name: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-invite-phone">
                                        Телефон
                                    </label>
                                    <div className="fo-invite-field-wrap">
                                        <Phone className="fo-invite-field-wrap__icon" size={18} />
                                        <input
                                            id="fo-invite-phone"
                                            type="tel"
                                            className="fo-invite-field fo-invite-field--icon"
                                            value={form.phone}
                                            onChange={handlePhoneChange}
                                            onFocus={handlePhoneFocus}
                                            placeholder={PHONE_PLACEHOLDER}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="fo-invite-modal__grid-2">
                                    <div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-invite-birth">
                                            Дата рождения
                                        </label>
                                        <input
                                            id="fo-invite-birth"
                                            type="date"
                                            className="fo-invite-field fo-invite-field--date"
                                            value={form.birth_date ?? ''}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    birth_date: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="fo-invite-group">
                                        <label className="label" htmlFor="fo-invite-gender">
                                            Пол
                                        </label>
                                        <select
                                            id="fo-invite-gender"
                                            className="fo-invite-field fo-invite-field--select"
                                            value={form.gender ?? ''}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    gender: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Не указан</option>
                                            <option value="male">Мужской</option>
                                            <option value="female">Женский</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="fo-invite-group">
                                    <label className="label" htmlFor="fo-invite-note">
                                        Комментарий (необязательно)
                                    </label>
                                    <textarea
                                        id="fo-invite-note"
                                        className="fo-invite-field fo-invite-field--textarea"
                                        value={form.source_note ?? ''}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                source_note: e.target.value,
                                            }))
                                        }
                                        placeholder="Демо ПФП, источник лида…"
                                        rows={3}
                                    />
                                </div>

                                <div className="fo-invite-actions">
                                    <button
                                        type="button"
                                        className="fo-invite-btn-cancel"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Отправка…' : 'Отправить приглашение'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FamilyOfficeInviteModal;
