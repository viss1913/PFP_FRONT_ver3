export type PublicRouteId = 'invite-activate' | null;

export function resolvePublicRoute(pathname: string): PublicRouteId {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/invite/activate') return 'invite-activate';
    return null;
}
