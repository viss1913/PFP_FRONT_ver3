import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, User } from 'lucide-react';
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="premium-card"
                        style={{
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '22px', marginBottom: '8px', paddingRight: '32px' }}>
                            Пригласить в Family Office
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                            Субагент получит письмо со ссылкой для активации аккаунта.
                        </p>

                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(34, 197, 94, 0.12)',
                                    border: '1px solid rgba(34, 197, 94, 0.35)',
                                    marginBottom: '20px',
                                }}
                            >
                                <p style={{ margin: 0, fontWeight: 600, color: '#86efac' }}>
                                    Письмо отправлено
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    На <strong style={{ color: '#fff' }}>{success.email}</strong>
                                    {success.expires_at && (
                                        <>
                                            {' '}
                                            · действует до {formatExpiresAt(success.expires_at)}
                                        </>
                                    )}
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.35)',
                                            color: '#fca5a5',
                                            fontSize: '14px',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <div className="input-group">
                                    <label className="label">Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail
                                            size={18}
                                            style={{
                                                position: 'absolute',
                                                left: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-muted)',
                                            }}
                                        />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, email: e.target.value }))
                                            }
                                            placeholder="ivan@example.com"
                                            style={{ paddingLeft: '40px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label className="label">Имя</label>
                                        <div style={{ position: 'relative' }}>
                                            <User
                                                size={18}
                                                style={{
                                                    position: 'absolute',
                                                    left: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: 'var(--text-muted)',
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={form.first_name}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        first_name: e.target.value,
                                                    }))
                                                }
                                                style={{ paddingLeft: '40px' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Фамилия</label>
                                        <input
                                            type="text"
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

                                <div className="input-group">
                                    <label className="label">Телефон</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone
                                            size={18}
                                            style={{
                                                position: 'absolute',
                                                left: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-muted)',
                                            }}
                                        />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={handlePhoneChange}
                                            onFocus={handlePhoneFocus}
                                            placeholder={PHONE_PLACEHOLDER}
                                            style={{ paddingLeft: '40px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label className="label">Дата рождения</label>
                                        <input
                                            type="date"
                                            value={form.birth_date ?? ''}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    birth_date: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Пол</label>
                                        <select
                                            value={form.gender ?? ''}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    gender: e.target.value,
                                                }))
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                            }}
                                        >
                                            <option value="">Не указан</option>
                                            <option value="male">Мужской</option>
                                            <option value="female">Женский</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="label">Комментарий (необязательно)</label>
                                    <textarea
                                        value={form.source_note ?? ''}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                source_note: e.target.value,
                                            }))
                                        }
                                        placeholder="Демо ПФП, источник лида…"
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 600,
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ flex: 2 }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Отправка…' : 'Отправить приглашение'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {success && (
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ width: '100%' }}
                                onClick={onClose}
                            >
                                Закрыть
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FamilyOfficeInviteModal;
