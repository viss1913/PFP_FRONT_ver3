import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    agentLkApi,
    type AgentProfileRecord,
    type AgentProfileUpdatePayload,
} from '../api/agentLkApi';
import { useAgentProfileOptional } from '../context/AgentProfileContext';
import './AgentProfileModal.css';

interface AgentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FormState = {
    first_name: string;
    last_name: string;
    middle_name: string;
    phone: string;
    passport_series: string;
    passport_number: string;
    birth_date: string;
    gender: '' | 'male' | 'female';
    position_title: string;
    region: string;
    city: string;
    signature_image_url: string;
};

const emptyForm = (): FormState => ({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',
    passport_series: '',
    passport_number: '',
    birth_date: '',
    gender: '',
    position_title: '',
    region: '',
    city: '',
    signature_image_url: '',
});

function agentToForm(agent: AgentProfileRecord): FormState {
    return {
        first_name: agent.first_name ?? '',
        last_name: agent.last_name ?? '',
        middle_name: agent.middle_name ?? '',
        phone: agent.phone ?? '',
        passport_series: agent.passport_series ?? '',
        passport_number: agent.passport_number ?? '',
        birth_date: agent.birth_date?.slice(0, 10) ?? '',
        gender: agent.gender ?? '',
        position_title: agent.position_title ?? '',
        region: agent.region ?? '',
        city: agent.city ?? '',
        signature_image_url: agent.signature_image_url ?? '',
    };
}

function formToPayload(form: FormState): AgentProfileUpdatePayload {
    const payload: AgentProfileUpdatePayload = {
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        middle_name: form.middle_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        passport_series: form.passport_series.trim() || undefined,
        passport_number: form.passport_number.trim() || undefined,
        birth_date: form.birth_date.trim() || undefined,
        gender: form.gender || undefined,
        position_title: form.position_title.trim() || undefined,
        region: form.region.trim() || undefined,
        city: form.city.trim() || undefined,
    };
    return payload;
}

function getAgentErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as { response?: { data?: { message?: string } } }).response?.data;
        if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return 'Не удалось сохранить профиль';
}

const AgentProfileModal: React.FC<AgentProfileModalProps> = ({ isOpen, onClose }) => {
    const agentCtx = useAgentProfileOptional();
    const agentId = agentCtx?.profile?.agentId;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormState>(emptyForm);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !agentId) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        agentLkApi
            .getAgent(agentId)
            .then((agent) => {
                if (cancelled) return;
                setForm(agentToForm(agent));
                setEmail(agent.email ?? agentCtx?.profile?.email ?? '');
            })
            .catch(() => {
                if (!cancelled) setError('Не удалось загрузить профиль агента');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, agentId, agentCtx?.profile?.email]);

    const handleChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSignatureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !agentId) return;

        setUploadingSignature(true);
        setError(null);
        try {
            const res = await agentLkApi.uploadAgentSignature(agentId, file);
            const url =
                res.signature_image_url ??
                res.url ??
                res.agent?.signature_image_url ??
                '';
            if (url) {
                setForm((prev) => ({ ...prev, signature_image_url: url }));
            }
        } catch (err) {
            setError(getAgentErrorMessage(err));
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentId) return;
        if (!form.first_name.trim() || !form.last_name.trim()) {
            setError('Укажите имя и фамилию');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const updated = await agentLkApi.updateAgent(agentId, formToPayload(form));
            agentCtx?.applyProfileFromAuth({
                first_name: updated.first_name ?? form.first_name.trim(),
                last_name: updated.last_name ?? form.last_name.trim(),
            });
            await agentCtx?.refreshProfile();
            onClose();
        } catch (err) {
            setError(getAgentErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="agent-profile-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="agent-profile-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="agent-profile-title"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="agent-profile-modal__head">
                            <h2 id="agent-profile-title" className="agent-profile-modal__title">
                                Профиль агента
                            </h2>
                            <button
                                type="button"
                                className="agent-profile-modal__close"
                                onClick={onClose}
                                aria-label="Закрыть"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form className="agent-profile-modal__body" onSubmit={(e) => void handleSubmit(e)}>
                            {loading && <p className="agent-profile-modal__hint">Загрузка…</p>}
                            {error && <div className="agent-profile-modal__error">{error}</div>}

                            {!loading && (
                                <>
                                    <div className="agent-profile-modal__field agent-profile-modal__field--full">
                                        <span className="agent-profile-modal__label">Email</span>
                                        <input
                                            className="agent-profile-modal__input"
                                            value={email}
                                            readOnly
                                            disabled
                                        />
                                        <p className="agent-profile-modal__hint">
                                            Email меняется через администратора
                                        </p>
                                    </div>

                                    <div className="agent-profile-modal__grid">
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Имя *</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.first_name}
                                                onChange={(e) => handleChange('first_name', e.target.value)}
                                                autoComplete="given-name"
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Фамилия *</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.last_name}
                                                onChange={(e) => handleChange('last_name', e.target.value)}
                                                autoComplete="family-name"
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field agent-profile-modal__field--full">
                                            <span className="agent-profile-modal__label">Отчество</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.middle_name}
                                                onChange={(e) => handleChange('middle_name', e.target.value)}
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Телефон</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                type="tel"
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Должность</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.position_title}
                                                onChange={(e) => handleChange('position_title', e.target.value)}
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Серия паспорта</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.passport_series}
                                                onChange={(e) => handleChange('passport_series', e.target.value)}
                                                inputMode="numeric"
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Номер паспорта</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.passport_number}
                                                onChange={(e) => handleChange('passport_number', e.target.value)}
                                                inputMode="numeric"
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Дата рождения</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                type="date"
                                                value={form.birth_date}
                                                onChange={(e) => handleChange('birth_date', e.target.value)}
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Пол</span>
                                            <select
                                                className="agent-profile-modal__select"
                                                value={form.gender}
                                                onChange={(e) =>
                                                    handleChange('gender', e.target.value as FormState['gender'])
                                                }
                                            >
                                                <option value="">—</option>
                                                <option value="male">Мужской</option>
                                                <option value="female">Женский</option>
                                            </select>
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Регион</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.region}
                                                onChange={(e) => handleChange('region', e.target.value)}
                                            />
                                        </label>
                                        <label className="agent-profile-modal__field">
                                            <span className="agent-profile-modal__label">Город</span>
                                            <input
                                                className="agent-profile-modal__input"
                                                value={form.city}
                                                onChange={(e) => handleChange('city', e.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="agent-profile-modal__field agent-profile-modal__field--full">
                                        <span className="agent-profile-modal__label">Подпись агента</span>
                                        <p className="agent-profile-modal__hint">
                                            PNG, JPEG или WebP до 8 МБ — для NDA и документов
                                        </p>
                                        <div className="agent-profile-modal__signature">
                                            {form.signature_image_url ? (
                                                <img
                                                    src={form.signature_image_url}
                                                    alt="Подпись"
                                                    className="agent-profile-modal__signature-preview"
                                                />
                                            ) : null}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                hidden
                                                onChange={(e) => void handleSignatureFile(e)}
                                            />
                                            <button
                                                type="button"
                                                className="agent-profile-modal__upload-btn"
                                                disabled={uploadingSignature || !agentId}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {uploadingSignature
                                                    ? 'Загрузка…'
                                                    : form.signature_image_url
                                                      ? 'Заменить подпись'
                                                      : 'Загрузить подпись'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </form>

                        <div className="agent-profile-modal__footer">
                            <button
                                type="button"
                                className="agent-profile-modal__btn agent-profile-modal__btn--ghost"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="agent-profile-modal__btn agent-profile-modal__btn--primary"
                                disabled={loading || saving || !agentId}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const formEl = e.currentTarget.closest('.agent-profile-modal')?.querySelector('form');
                                    formEl?.requestSubmit();
                                }}
                            >
                                {saving ? 'Сохранение…' : 'Сохранить'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AgentProfileModal;
