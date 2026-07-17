/**
 * Constructor site-chat виджеты (Ростех / НПФ Рени).
 * Источник: partner-widgets/constructor-chat (из frontRostech AI_NPF_Rostech).
 * Кладёт артефакты в dist/rostech и dist/npf — отдельно от SPA.
 *
 * Env (из .env, не VITE_*):
 *   ROSTECH_PROJECT_KEY, RENESSANS_PROJECT_KEY (или RENESANS_*)
 *   ROSTECH_API_BASE_URL / RENESSANS_API_BASE_URL (дефолт pfp-api.bank-future.com)
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './load-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = resolve(root, 'partner-widgets', 'constructor-chat');
const distRoot = resolve(root, 'dist');

const fileEnv = loadEnvFile(resolve(root, '.env'));
const env = { ...process.env, ...fileEnv };

const apiBase = (
  env.RENESSANS_API_BASE_URL ||
  env.RENESANS_API_BASE_URL ||
  env.ROSTECH_API_BASE_URL ||
  'https://pfp-api.bank-future.com'
).replace(/\/$/, '');

const npfProjectKey =
  env.RENESSANS_PROJECT_KEY || env.RENESANS_PROJECT_KEY || '';
const rostechProjectKey = env.ROSTECH_PROJECT_KEY || '';

if (!existsSync(resolve(srcRoot, 'src', 'widget.js'))) {
  console.error('[partner-widgets] нет partner-widgets/constructor-chat/src/widget.js');
  process.exit(1);
}

if (!npfProjectKey) {
  console.warn(
    '[partner-widgets] RENESSANS_PROJECT_KEY не задан — /npf уйдёт с пустым project key',
  );
}
if (!rostechProjectKey) {
  console.warn(
    '[partner-widgets] ROSTECH_PROJECT_KEY не задан — /rostech уйдёт с пустым project key',
  );
}

const widgetSrc = readFileSync(resolve(srcRoot, 'src', 'widget.js'), 'utf8').replace(
  /__ROSTECH_API_BASE_URL__/g,
  apiBase,
);

const avatarSrc = resolve(srcRoot, 'assets', 'bot-avatar.png');

function buildLane({ lane, demoFile, projectKey }) {
  const outDir = resolve(distRoot, lane);
  mkdirSync(resolve(outDir, 'assets'), { recursive: true });

  writeFileSync(resolve(outDir, 'widget.js'), widgetSrc, 'utf8');

  const demoPath = resolve(srcRoot, 'src', demoFile);
  if (!existsSync(demoPath)) {
    console.warn(`[partner-widgets] нет ${demoFile} — lane ${lane} пропущен`);
    return false;
  }
  const html = readFileSync(demoPath, 'utf8').replace(
    /__ROSTECH_PROJECT_KEY__/g,
    projectKey,
  );
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf8');

  if (existsSync(avatarSrc)) {
    copyFileSync(avatarSrc, resolve(outDir, 'assets', 'bot-avatar.png'));
  } else {
    console.warn('[partner-widgets] assets/bot-avatar.png не найден');
  }

  console.log(`[partner-widgets] OK → dist/${lane}/ (api=${apiBase})`);
  return true;
}

mkdirSync(distRoot, { recursive: true });

buildLane({
  lane: 'npf',
  demoFile: 'demo-npf.html',
  projectKey: npfProjectKey,
});
buildLane({
  lane: 'rostech',
  demoFile: 'demo-rostech.html',
  projectKey: rostechProjectKey,
});
