export type PublicRouteId = 'invite-activate' | 'agent-register' | 'sber-landing' | null;

export function resolvePublicRoute(pathname: string): PublicRouteId {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/invite/activate') return 'invite-activate';
    if (path === '/register') return 'agent-register';
    if (path === '/sber') return 'sber-landing';
    return null;
}
