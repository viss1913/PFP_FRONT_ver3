/**
 * Yandex Object Storage / CDN не всегда отдаёт index.html на вложенные path.
 * Копируем index.html в каталоги публичных SPA-маршрутов.
 * Для /plan подменяем title/description/OG — Telegram читает статику, не SPA.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const indexHtml = resolve(distDir, 'index.html');

/** Path segments under dist/ — must match publicRoutes in src/routing/publicRoutes.ts */
const SPA_ROUTES = ['sber', 'invite/activate', 'register', 'atb_mass', 'atb_bank', 'plan', 'b2c', 'cabinet'];

/** Статические meta для crawler preview (Telegram / WhatsApp / VK). */
const B2C_PLAN_META = {
    title: 'Ваш Family Office — будущее вашей семьи',
    description:
        'Семейный капитал под контролем: защита, рост и понятный план. Family Office — пространство, где финансы семьи собираются в одну систему.',
};

const ROUTE_META = {
    plan: {
        ...B2C_PLAN_META,
        canonicalPath: '/plan/',
    },
    b2c: {
        ...B2C_PLAN_META,
        canonicalPath: '/b2c/',
    },
};

function escapeAttr(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function patchHtmlMeta(html, meta) {
    const title = escapeAttr(meta.title);
    const description = escapeAttr(meta.description);
    let next = html;

    next = next.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

    next = next.replace(
        /<meta(\s+)name="description"(\s+)content="[^"]*"(\s*)\/?>/i,
        `<meta$1name="description"$2content="${description}"$3/>`,
    );

    next = next.replace(
        /<meta(\s+)property="og:title"(\s+)content="[^"]*"(\s*)\/?>/i,
        `<meta$1property="og:title"$2content="${title}"$3/>`,
    );
    next = next.replace(
        /<meta(\s+)property="og:description"(\s+)content="[^"]*"(\s*)\/?>/i,
        `<meta$1property="og:description"$2content="${description}"$3/>`,
    );

    next = next.replace(
        /<meta(\s+)name="twitter:title"(\s+)content="[^"]*"(\s*)\/?>/i,
        `<meta$1name="twitter:title"$2content="${title}"$3/>`,
    );
    next = next.replace(
        /<meta(\s+)name="twitter:description"(\s+)content="[^"]*"(\s*)\/?>/i,
        `<meta$1name="twitter:description"$2content="${description}"$3/>`,
    );

    if (meta.canonicalPath) {
        next = next.replace(
            /<link(\s+)rel="canonical"(\s+)href="[^"]*"(\s*)\/?>/i,
            (_match, a, b, c) => {
                // сохраняем origin из уже подставленного canonical, меняем только path
                const originMatch = html.match(/<link\s+rel="canonical"\s+href="(https?:\/\/[^/"]+)/i);
                const origin = originMatch?.[1] || 'https://family-office.bank-future.com';
                return `<link${a}rel="canonical"${b}href="${origin}${meta.canonicalPath}"${c}/>`;
            },
        );
        next = next.replace(
            /<meta(\s+)property="og:url"(\s+)content="[^"]*"(\s*)\/?>/i,
            (_match, a, b, c) => {
                const originMatch = html.match(/<meta\s+property="og:url"\s+content="(https?:\/\/[^/"]+)/i);
                const origin = originMatch?.[1] || 'https://family-office.bank-future.com';
                return `<meta${a}property="og:url"${b}content="${origin}${meta.canonicalPath}"${c}/>`;
            },
        );
    }

    return next;
}

if (!existsSync(indexHtml)) {
    console.error('dist/index.html не найден. Сначала: npm run build');
    process.exit(1);
}

for (const route of SPA_ROUTES) {
    const dir = resolve(distDir, route);
    mkdirSync(dir, { recursive: true });
    const target = resolve(dir, 'index.html');
    copyFileSync(indexHtml, target);

    const routeMeta = ROUTE_META[route];
    if (routeMeta) {
        const raw = readFileSync(target, 'utf8');
        writeFileSync(target, patchHtmlMeta(raw, routeMeta), 'utf8');
        console.log(`SPA fallback: dist/${route}/index.html (meta patched)`);
    } else {
        console.log(`SPA fallback: dist/${route}/index.html`);
    }
}

console.log('[OK] copy-spa-fallbacks');
