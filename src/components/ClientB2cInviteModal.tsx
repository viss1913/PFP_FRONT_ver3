import React, { useEffect, useState } from 'react';
import { X, UserPlus, Link2, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { agentLkApi, getSubagentInviteErrorMessage } from '../api/agentLkApi';
import { normalizeClientInviteUrl } from '../utils/clientB2cAttribution';
import './FamilyOfficeInviteModal.css';

interface ClientB2cInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ClientB2cInviteModal: React.FC<ClientB2cInviteModalProps> = ({ isOpen, onClose }) => {
    const [inviteUrl, setInviteUrl] = useState('');
    const [referralSlug, setReferralSlug] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setCopied(false);
        setLinkError(null);
        setInviteUrl('');
        setReferralSlug('');

        let cancelled = false;
        void (async () => {
            setLinkLoading(true);
            try {
                const data = await agentLkApi.getClientInviteLink();
                if (!cancelled) {
                    setInviteUrl(normalizeClientInviteUrl(data.url));
                    setReferralSlug(data.referral_slug || data.ref || '');
                }
            } catch (err) {
                if (!cancelled) {
                    setLinkError(getSubagentInviteErrorMessage(err));
                }
            } finally {
                if (!cancelled) setLinkLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setLinkError('Не удалось скопировать ссылку');
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
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="client-b2c-invite-title"
                    >
                        <button
                            type="button"
                            className="fo-invite-modal__close"
                            onClick={onClose}
                            aria-label="Закрыть"
                        >
                            <X size={20} />
                        </button>

                        <div className="fo-invite-modal__header">
                            <div className="fo-invite-modal__icon">
                                <UserPlus size={22} />
                            </div>
                            <h2 id="client-b2c-invite-title" className="fo-invite-modal__title">
                                Пригласить клиента
                            </h2>
                            <p className="fo-invite-modal__subtitle">
                                Отправьте ссылку клиенту: он пройдёт финансовый план на сайте и после
                                регистрации попадёт в ваш CRM.
                            </p>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                            <label
                                className="fo-invite-field__label"
                                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                            >
                                <Link2 size={14} />
                                Ссылка на Family Office (B2C)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={linkLoading ? 'Загрузка…' : inviteUrl}
                                    className="fo-invite-field__input"
                                    style={{ flex: 1, fontSize: '13px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleCopy()}
                                    disabled={!inviteUrl || linkLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '0 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        background: copied ? '#dcfce7' : '#f9fafb',
                                        color: copied ? '#16a34a' : '#374151',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: inviteUrl ? 'pointer' : 'default',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Скопировано' : 'Копировать'}
                                </button>
                            </div>
                            {referralSlug ? (
                                <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    ref: <code>{referralSlug}</code>
                                </p>
                            ) : null}
                            {linkError ? (
                                <p className="fo-invite-modal__error" style={{ marginTop: '8px' }}>
                                    {linkError}
                                </p>
                            ) : null}
                        </div>

                        <button type="button" className="fo-invite-modal__submit" onClick={onClose}>
                            Готово
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ClientB2cInviteModal;
