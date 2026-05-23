import type { Client } from '../types/client';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REBALANCE_DAYS = 180;

export type DueBadgeTone = 'ok' | 'soon' | 'overdue' | 'unknown';

export interface DueBadge {
    label: string;
    tone: DueBadgeTone;
}

/** Дата последнего пересчёта ПФП — только `last_rebalance_at` с бэка (не updated_at / last_pfp_at). */
export function getLastRebalanceDate(client: Client): Date | null {
    const raw = client.last_rebalance_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(base: Date, days: number): Date {
    const scheduled = new Date(base.getTime() + days * MS_PER_DAY);
    return Number.isNaN(scheduled.getTime()) ? new Date(NaN) : scheduled;
}

function getCreatedDate(client: Client): Date | null {
    if (!client.created_at) return null;
    const d = new Date(client.created_at);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Следующая годовщина от даты создания (продление СЖ раз в год).
 * Если годовщина в этом году ещё впереди — она; если уже прошла — та же дата в этом году (бейдж «просрочено»).
 */
function getNextAnnualAnniversaryFromCreated(created: Date, from: Date = new Date()): Date {
    const anniversary = new Date(created);
    anniversary.setFullYear(from.getFullYear());
    const anniversaryDay = startOfDay(anniversary);
    const today = startOfDay(from);
    if (anniversaryDay.getTime() >= today.getTime()) {
        return anniversaryDay;
    }
    return anniversaryDay;
}

/** След. ребалансировка: last_rebalance_at + 180 дней (нет даты — нет плана / не было пересчёта). */
export function getNextRebalanceDate(client: Client): Date | null {
    const base = getLastRebalanceDate(client);
    if (!base) return null;
    const scheduled = addDays(base, REBALANCE_DAYS);
    return Number.isNaN(scheduled.getTime()) ? null : scheduled;
}

/** Продление полиса СЖ: ежегодно в день годовщины `created_at`. */
export function getLifeInsuranceRenewalDate(client: Client): Date | null {
    const created = getCreatedDate(client);
    if (!created) return null;
    return getNextAnnualAnniversaryFromCreated(created);
}

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

/** Дней до target (отрицательное = просрочено). */
export function daysUntil(target: Date, from: Date = new Date()): number {
    const diff = startOfDay(target).getTime() - startOfDay(from).getTime();
    return Math.round(diff / MS_PER_DAY);
}

export function formatRelativeDueBadge(target: Date | null): DueBadge {
    if (!target) {
        return { label: '—', tone: 'unknown' };
    }
    const d = daysUntil(target);
    if (d < 0) {
        const overdue = Math.abs(d);
        return {
            label: overdue === 1 ? 'Просрочено на 1 день' : `Просрочено на ${overdue} дн.`,
            tone: 'overdue',
        };
    }
    if (d === 0) {
        return { label: 'Сегодня', tone: 'soon' };
    }
    if (d <= 14) {
        return {
            label: d === 1 ? 'Через 1 день' : `Через ${d} дн.`,
            tone: 'soon',
        };
    }
    return {
        label: `Через ${d} дн.`,
        tone: 'ok',
    };
}

export function formatDateShort(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTimeActivity(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Сегодня, ${time}`;
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getClientActivityDate(client: Client): Date | null {
    const raw = client.updated_at ?? client.last_pfp_at ?? client.created_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Timestamp для client-side сортировки по last_rebalance_at. */
export function getLastRebalanceTimestamp(client: Client): number {
    const d = getLastRebalanceDate(client);
    return d ? d.getTime() : 0;
}

export function getAgeFromBirthDate(birthDate?: string): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }
    return age >= 0 ? age : null;
}

export function formatBirthDateAndAge(birthDate?: string): string {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return '—';
    const formatted = birth.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const age = getAgeFromBirthDate(birthDate);
    return age != null ? `${formatted} · ${age} лет` : formatted;
}

export function getClientInitials(client: Client): string {
    const first = client.first_name?.trim()?.[0] ?? '';
    const last = client.last_name?.trim()?.[0] ?? '';
    const combined = `${first}${last}`.toUpperCase();
    return combined || '?';
}
