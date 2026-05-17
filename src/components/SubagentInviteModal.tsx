import React, { useEffect, useState } from 'react';
import { X, Mail, UserPlus, Link2, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    agentLkApi,
    getSubagentInviteErrorMessage,
    type SubagentInviteEmailResponse,
} from '../api/agentLkApi';
import './FamilyOfficeInviteModal.css';

interface SubagentInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (res: SubagentInviteEmailResponse) => void;
}

function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

const SubagentInviteModal: React.FC<SubagentInviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [inviteUrl, setInviteUrl] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [toEmail, setToEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [sendLoading, setSendLoading] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [success, setSuccess] = useState<SubagentInviteEmailResponse | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setToEmail('');
        setRecipientName('');
        setSendError(null);
        setSuccess(null);
        setCopied(false);
        setLinkError(null);
        setInviteUrl('');

        let cancelled = false;
        (async () => {
            setLinkLoading(true);
            try {
                const data = await agentLkApi.getAgentInviteLink();
                if (!cancelled) setInviteUrl(data.url);
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(toEmail)) {
            setSendError('Введите корректный email');
            return;
        }
        setSendLoading(true);
        setSendError(null);
        try {
            const res = await agentLkApi.sendSubagentInviteEmail({
                to_email: toEmail,
                recipient_name: recipientName || undefined,
            });
            setSuccess(res);
            onSuccess?.(res);
        } catch (err) {
            setSendError(getSubagentInviteErrorMessage(err));
        } finally {
            setSendLoading(false);
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
                            aria-labelledby="subagent-invite-title"
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
                                <h2 id="subagent-invite-title" className="fo-invite-modal__title">
                                    Пригласить субагента
                                </h2>
                                <p className="fo-invite-modal__subtitle">
                                    Саморегистрация по ссылке: субагент попадёт в вашу сеть через параметр ref.
                                </p>
                            </div>

                            {success ? (
                                <div className="fo-invite-modal__success">
                                    <Check size={40} style={{ color: '#16a34a', marginBottom: '12px' }} />
                                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                                        {success.message || 'Приглашение отправлено'}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                                        Письмо отправлено на {success.to_email}
                                    </p>
                                    <button
                                        type="button"
                                        className="fo-invite-modal__submit"
                                        style={{ marginTop: '20px' }}
                                        onClick={onClose}
                                    >
                                        Готово
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label className="fo-invite-field__label" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <Link2 size={14} />
                                            Реферальная ссылка
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
                                                onClick={handleCopy}
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
                                        {linkError && (
                                            <p className="fo-invite-modal__error" style={{ marginTop: '8px' }}>
                                                {linkError}
                                            </p>
                                        )}
                                    </div>

                                    <form onSubmit={handleSend}>
                                        <p
                                            style={{
                                                fontSize: '13px',
                                                color: 'var(--text-muted)',
                                                margin: '0 0 16px',
                                                paddingTop: '4px',
                                                borderTop: '1px solid #eee',
                                            }}
                                        >
                                            Или отправьте приглашение на email — в письме будет та же ссылка.
                                        </p>

                                        <div className="fo-invite-field" style={{ marginBottom: '12px' }}>
                                            <label className="fo-invite-field__label" htmlFor="subagent-invite-email">
                                                <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                                Email субагента
                                            </label>
                                            <input
                                                id="subagent-invite-email"
                                                type="email"
                                                className="fo-invite-field__input"
                                                value={toEmail}
                                                onChange={(e) => setToEmail(e.target.value)}
                                                placeholder="agent@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="fo-invite-field" style={{ marginBottom: '16px' }}>
                                            <label className="fo-invite-field__label" htmlFor="subagent-invite-name">
                                                Имя в письме (необязательно)
                                            </label>
                                            <input
                                                id="subagent-invite-name"
                                                type="text"
                                                className="fo-invite-field__input"
                                                value={recipientName}
                                                onChange={(e) => setRecipientName(e.target.value)}
                                                placeholder="Иван"
                                            />
                                        </div>

                                        {sendError && <p className="fo-invite-modal__error">{sendError}</p>}

                                        <button
                                            type="submit"
                                            className="fo-invite-modal__submit"
                                            disabled={sendLoading}
                                        >
                                            {sendLoading ? 'Отправка…' : 'Отправить приглашение'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SubagentInviteModal;
