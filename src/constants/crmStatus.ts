import type { ClientStatus } from '../types/client';

export const CRM_STATUS_LABELS: Record<ClientStatus, string> = {
    THINKING: 'Думает',
    BOUGHT: 'Купил',
    REFUSED: 'Отказался',
    RENEWAL: 'Продление',
};

export const CRM_STATUS_COLORS: Record<ClientStatus, string> = {
    THINKING: '#FFA500',
    BOUGHT: '#22C55E',
    REFUSED: '#EF4444',
    RENEWAL: '#3B82F6',
};

export const CRM_STATUS_ORDER: ClientStatus[] = ['THINKING', 'BOUGHT', 'REFUSED', 'RENEWAL'];
