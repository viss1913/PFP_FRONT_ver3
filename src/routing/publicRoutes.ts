import { isAtbMassPath } from '../config/atbMass';

export type PublicRouteId = 'invite-activate' | 'agent-register' | 'sber-landing' | 'atb-mass' | null;

export function resolvePublicRoute(pathname: string): PublicRouteId {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (path === '/invite/activate') return 'invite-activate';
    if (path === '/register') return 'agent-register';
    if (path === '/sber') return 'sber-landing';
    if (isAtbMassPath(path)) return 'atb-mass';
    return null;
}
