/**
 * Генерирует dist/robots.txt и dist/sitemap.xml с актуальным origin из .env (VITE_SITE_URL).
 */
import { writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './load-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');

const fileEnv = loadEnvFile(resolve(root, '.env'));
const origin = (fileEnv.VITE_SITE_URL?.trim() || 'https://family-office.bank-future.com').replace(/\/$/, '');

if (!existsSync(distDir)) {
    console.error('dist/ не найден. Сначала: npm run build');
    process.exit(1);
}

const publicPaths = ['/', '/?page=privacy', '/sber'];

const robots = `User-agent: *
Allow: /
Allow: /sber
Disallow: /invite/
Disallow: /register/
Disallow: /atb_mass
Disallow: /atb_bank

# Служебные и личный кабинет — noindex через meta в SPA
Disallow: /*?page=login
Disallow: /*?page=preview
Disallow: /*?page=html-report-preview
Disallow: /*?page=test
Disallow: /*?page=result-demo

Sitemap: ${origin}/sitemap.xml
`;

const urlEntries = publicPaths
    .map((path) => {
        const loc = path === '/' ? `${origin}/` : `${origin}${path}`;
        return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/sber' ? '0.9' : '0.5'}</priority>
  </url>`;
    })
    .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(resolve(distDir, 'robots.txt'), robots, 'utf8');
writeFileSync(resolve(distDir, 'sitemap.xml'), sitemap, 'utf8');

console.log(`[OK] SEO static: robots.txt, sitemap.xml → ${origin}`);
