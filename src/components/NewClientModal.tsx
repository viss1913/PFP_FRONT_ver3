import React, { useState, useEffect } from 'react';
import { X, User, Phone, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusDropdown from './StatusDropdown';
import type { ClientStatus } from '../types/client';

interface NewClientData {
    fio: string;
    phone: string;
    uuid: string;
    crm_status: ClientStatus;
}

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewClientData) => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [fio, setFio] = useState('');
    const [phone, setPhone] = useState('+7 (');
    const [uuid, setUuid] = useState('');
    const [status, setStatus] = useState<ClientStatus>('THINKING');

    useEffect(() => {
        if (isOpen) {
            // Generate UUID on open
            try {
                setUuid(crypto.randomUUID());
            } catch (e) {
                // Fallback if crypto.randomUUID is not available (e.g. non-secure context)
                setUuid(Date.now().toString(36) + Math.random().toString(36).substr(2));
            }
            setFio('');
            setPhone('+7 (');
            setStatus('THINKING');
        }
    }, [isOpen]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        let numbersValue = input.replace(/\D/g, '');

        // Handle empty or just prefix deletion attempt
        if (!numbersValue) {
            setPhone('+7 (');
            return;
        }

        // If user provided 7 or 8 at start, strip it to get pure parts
        // This handles cases where user pastes 8999... or 7999...
        if (['7', '8'].includes(numbersValue[0])) {
            numbersValue = numbersValue.substring(1);
        }

        // Truncate to max 10 digits
        const nums = numbersValue.slice(0, 10);

        let formatted = '+7';
        if (nums.length > 0) {
            formatted += ' (' + nums.substring(0, 3);
        }
        if (nums.length >= 4) {
            formatted += ') ' + nums.substring(3, 6);
        }
        if (nums.length >= 7) {
            formatted += '-' + nums.substring(6, 8);
        }
        if (nums.length >= 9) {
            formatted += '-' + nums.substring(8, 10);
        }

        setPhone(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ fio, phone, uuid, crm_status: status });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay Container - handle centering via flexbox */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        {/* Modal Content - stop propagation so clicking content doesn't close */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="premium-card"
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                            }}
                        >
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Новый клиент</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label className="label">ФИО клиента</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={fio}
                                            onChange={(e) => setFio(e.target.value)}
                                            placeholder="Иванов Иван Иванович"
                                            style={{ paddingLeft: '40px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="label">Телефон</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            placeholder="+7 (999) 000-00-00"
                                            style={{ paddingLeft: '40px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="label">ID (UUID)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Fingerprint size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={uuid}
                                            readOnly
                                            style={{
                                                paddingLeft: '40px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'var(--text-muted)',
                                                cursor: 'default'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="label">Статус продажи</label>
                                    <StatusDropdown
                                        currentStatus={status}
                                        onStatusChange={setStatus}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                                        Продолжить
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NewClientModal;
