/**
 * Smoke: /rostech и /npf живы на CDN (не SPA fallback / 404).
 * Env: VITE_SITE_URL или PARTNER_WIDGETS_SMOKE_BASE (дефолт family-office.bank-future.com).
 */
import { loadEnvFile } from './load-env.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fileEnv = loadEnvFile(resolve(root, '.env'));
const env = { ...process.env, ...fileEnv };

const base = (
  env.PARTNER_WIDGETS_SMOKE_BASE ||
  env.VITE_SITE_URL ||
  'https://family-office.bank-future.com'
).replace(/\/$/, '');

const checks = [
  {
    path: '/rostech/',
    mustInclude: ['AI Ростех', 'widget.js'],
    mustNotInclude: ['BankFuture — платформа'],
  },
  {
    path: '/npf/',
    mustInclude: ['Ренессанс', 'RostechChatWidget'],
    mustNotInclude: ['BankFuture — платформа'],
  },
  {
    path: '/rostech/widget.js',
    mustInclude: ['RostechChatWidget'],
    mustNotInclude: ['BankFuture — платформа'],
  },
];

let failed = 0;

for (const check of checks) {
  const url = `${base}${check.path}`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'cache-control': 'no-cache' },
    });
    const text = await res.text();
    const problems = [];
    if (!res.ok) problems.push(`HTTP ${res.status}`);
    for (const needle of check.mustInclude) {
      if (!text.includes(needle)) problems.push(`нет «${needle}»`);
    }
    for (const needle of check.mustNotInclude) {
      if (text.includes(needle)) problems.push(`попал SPA fallback («${needle}»)`);
    }
    if (problems.length) {
      failed += 1;
      console.error(`FAIL ${url}: ${problems.join('; ')}`);
    } else {
      console.log(`OK   ${url}`);
    }
  } catch (e) {
    failed += 1;
    console.error(`FAIL ${url}: ${e?.message || e}`);
  }
}

if (failed) {
  console.error(
    `\nPartner widgets smoke failed (${failed}). ` +
      'Собери: npm run build:partner-widgets && node scripts/upload-partner-widgets-only.mjs',
  );
  process.exit(1);
}

console.log('\nPartner widgets smoke OK');
