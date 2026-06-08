import { Briefcase, LayoutDashboard, Settings } from 'lucide-react';
import type { LkNavItem } from './lkNavigation';

/** Меню ATB Bank lane: CRM, упрощённый ПФП, настройки. */
export const ATB_LK_NAV_ITEMS: LkNavItem[] = [
    { page: 'crm', label: 'AI CRM', icon: LayoutDashboard },
    { page: 'pfp', label: 'ПФП ATB', icon: Briefcase },
    { page: 'settings', label: 'Настройки', icon: Settings },
];
