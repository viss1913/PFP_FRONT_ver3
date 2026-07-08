export const CLIENT_TOKEN_KEY = 'client_token';
export const CLIENT_USER_KEY = 'client_user';

export interface ClientB2cUser {
    id?: number;
    email?: string;
    name?: string;
    role?: string;
    clientId?: number;
    projectId?: number;
    guest?: boolean;
}

export interface ClientB2cAuthResponse {
    token: string;
    user?: ClientB2cUser;
}

export function setGuestPlanSession(data: {
    guest_token: string;
    client_id: number;
    email?: string;
}): void {
    localStorage.setItem(CLIENT_TOKEN_KEY, data.guest_token);
    localStorage.setItem(
        CLIENT_USER_KEY,
        JSON.stringify({
            clientId: data.client_id,
            email: data.email,
            role: 'client',
            guest: true,
        }),
    );
}

export function isGuestPlanSaved(): boolean {
    const user = getClientB2cUser();
    return Boolean(getClientB2cToken() && user?.guest);
}

export function setClientB2cSession(auth: ClientB2cAuthResponse): void {
    localStorage.setItem(CLIENT_TOKEN_KEY, auth.token);
    if (auth.user) {
        localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(auth.user));
    }
}

export function getClientB2cToken(): string | null {
    return localStorage.getItem(CLIENT_TOKEN_KEY);
}

export function getClientB2cUser(): ClientB2cUser | null {
    try {
        const raw = localStorage.getItem(CLIENT_USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ClientB2cUser;
    } catch {
        return null;
    }
}

export function isClientB2cLoggedIn(): boolean {
    return Boolean(getClientB2cToken());
}

export function clearClientB2cSession(): void {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_KEY);
}
