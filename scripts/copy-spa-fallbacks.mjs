/**
 * Yandex Object Storage / CDN не всегда отдаёт index.html на вложенные path.
 * Копируем index.html в каталоги публичных SPA-маршрутов.
 */
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const indexHtml = resolve(distDir, 'index.html');

/** Path segments under dist/ — must match publicRoutes in src/routing/publicRoutes.ts */
const SPA_ROUTES = ['sber', 'invite/activate', 'register', 'atb_mass', 'atb_bank'];

if (!existsSync(indexHtml)) {
    console.error('dist/index.html не найден. Сначала: npm run build');
    process.exit(1);
}

for (const route of SPA_ROUTES) {
    const dir = resolve(distDir, route);
    mkdirSync(dir, { recursive: true });
    copyFileSync(indexHtml, resolve(dir, 'index.html'));
    console.log(`SPA fallback: dist/${route}/index.html`);
}

console.log('[OK] copy-spa-fallbacks');
