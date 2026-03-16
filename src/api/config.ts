/**
 * Базовый URL бэкенда PFP.
 * Берётся из VITE_API_URL; если не задан — используем боевой Railway.
 * Так запросы всегда идут на нужный сервер, в Network виден реальный URL.
 */
const RAW = import.meta.env.VITE_API_URL?.trim() || '';
export const API_BASE_URL = RAW ? RAW.replace(/\/$/, '') : 'https://pfpbackend-production.up.railway.app';

/** Базовый URL с /api для axios baseURL (клиенты, макросы и т.д.) */
export const API_BASE_WITH_API = `${API_BASE_URL}/api`;
