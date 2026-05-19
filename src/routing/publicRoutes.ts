export type PublicRouteId = 'invite-activate' | 'agent-register' | null;

export function resolvePublicRoute(pathname: string): PublicRouteId {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/invite/activate') return 'invite-activate';
    if (path === '/register') return 'agent-register';
    return null;
}
