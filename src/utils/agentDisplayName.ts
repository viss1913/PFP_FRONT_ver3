import type { AuthMeResponse } from '../api/authApi';

export function formatAgentDisplayName(profile: Pick<AuthMeResponse, 'first_name' | 'last_name' | 'email'> | null): string {
    const parts = [profile?.first_name, profile?.last_name]
        .map((s) => (s ?? '').trim())
        .filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const user = JSON.parse(raw) as { name?: string };
            if (user.name?.trim()) return user.name.trim();
        }
    } catch {
        /* ignore */
    }
    const email = profile?.email?.trim();
    if (email) return email.split('@')[0] ?? 'Агент';
    return 'Агент';
}
