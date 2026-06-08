import type { LucideIcon } from 'lucide-react';
import {
    Bot,
    Briefcase,
    LayoutDashboard,
    LineChart,
    MessageSquare,
    Newspaper,
    Settings,
} from 'lucide-react';

export type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

export interface LkNavItem {
    page: NavPage;
    label: string;
    icon: LucideIcon;
}

export const LK_NAV_ITEMS: LkNavItem[] = [
    { page: 'crm', label: 'AI CRM', icon: LayoutDashboard },
    { page: 'pfp', label: 'ПФП', icon: Briefcase },
    { page: 'ai-assistant', label: 'AI Помощник', icon: Bot },
    { page: 'ai-agent', label: 'AI-агент', icon: MessageSquare },
    { page: 'news', label: 'Новости', icon: Newspaper },
    { page: 'macro', label: 'Макростатистика', icon: LineChart },
    { page: 'settings', label: 'Настройки', icon: Settings },
];
