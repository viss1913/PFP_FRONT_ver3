import React, { useState } from 'react';
import { ChevronDown, Check, Clock, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { ClientStatus } from '../types/client';
import { clientApi } from '../api/clientApi';

interface StatusDropdownProps {
    clientId?: number;
    currentStatus?: ClientStatus;
    onStatusChange?: (newStatus: ClientStatus) => void;
    onOpenChange?: (isOpen: boolean) => void;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; icon: React.ReactNode }> = {
    'THINKING': { label: 'Думает', color: '#FFA500', icon: <Clock size={16} /> },
    'BOUGHT': { label: 'Купил', color: '#22C55E', icon: <Check size={16} /> },
    'REFUSED': { label: 'Отказался', color: '#EF4444', icon: <XCircle size={16} /> },
    'RENEWAL': { label: 'Продление', color: '#3B82F6', icon: <RefreshCw size={16} /> }
};

const StatusDropdown: React.FC<StatusDropdownProps> = ({ clientId, currentStatus = 'THINKING', onStatusChange, onOpenChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (onOpenChange) onOpenChange(nextState);
    };
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<ClientStatus>(currentStatus);

    const handleSelect = async (newStatus: ClientStatus) => {
        if (newStatus === status) {
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            if (clientId) {
                await clientApi.updateClientStatus({
                    client_id: clientId,
                    crm_status: newStatus
                });
            }
            setStatus(newStatus);
            if (onStatusChange) onStatusChange(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Не удалось обновить статус');
        } finally {
            setLoading(false);
            setIsOpen(false);
            if (onOpenChange) onOpenChange(false);
        }
    };

    const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG['THINKING'];

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleOpen();
                }}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${currentConfig.color}40`,
                    background: `${currentConfig.color}10`,
                    color: currentConfig.color,
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                }}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : currentConfig.icon}
                <span>{currentConfig.label}</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #eee',
                    zIndex: 100,
                    minWidth: '160px',
                    overflow: 'hidden',
                    padding: '4px'
                }}>
                    {(Object.keys(STATUS_CONFIG) as ClientStatus[]).map((key) => {
                        const config = STATUS_CONFIG[key];
                        return (
                            <div
                                key={key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(key);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: key === status ? config.color : '#333',
                                    background: key === status ? `${config.color}10` : 'transparent',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = `${config.color}05`}
                                onMouseLeave={(e) => e.currentTarget.style.background = key === status ? `${config.color}10` : 'transparent'}
                            >
                                {config.icon}
                                {config.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StatusDropdown;
