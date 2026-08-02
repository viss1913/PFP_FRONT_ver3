/**
 * Заливка dist/ в Yandex Object Storage (S3-совместимый API).
 * Переменные из .env в корне: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET_NAME.
 * Опционально: YC_S3_ENDPOINT (по умолчанию storage.yandexcloud.net).
 */
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './load-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');

function requireEnv(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    console.error(`Не задано ${key} в .env`);
    process.exit(1);
  }
  return value;
}

const fileEnv = loadEnvFile(resolve(root, '.env'));
const env = { ...process.env, ...fileEnv };

const bucket = requireEnv(env, 'BUCKET_NAME');
const accessKeyId = requireEnv(env, 'AWS_ACCESS_KEY_ID');
const secretAccessKey = requireEnv(env, 'AWS_SECRET_ACCESS_KEY');
const endpoint =
  env.YC_S3_ENDPOINT?.trim() || 'https://storage.yandexcloud.net';

if (!existsSync(distDir)) {
  console.error('Папка dist/ не найдена. Сначала: npm run build');
  process.exit(1);
}

const awsEnv = {
  ...process.env,
  AWS_ACCESS_KEY_ID: accessKeyId,
  AWS_SECRET_ACCESS_KEY: secretAccessKey,
  AWS_DEFAULT_REGION: env.AWS_DEFAULT_REGION?.trim() || 'ru-central1',
  HTTP_PROXY: '',
  HTTPS_PROXY: '',
  ALL_PROXY: '',
  http_proxy: '',
  https_proxy: '',
  all_proxy: '',
  NO_PROXY: '*',
  no_proxy: '*',
};

const prefix = env.YC_S3_PREFIX?.trim().replace(/^\//, '').replace(/\/$/, '');
const destination = prefix ? `s3://${bucket}/${prefix}/` : `s3://${bucket}/`;

console.log(`Синхронизация ${distDir} → ${destination}`);
console.log(`Endpoint: ${endpoint}`);

const result = spawnSync(
  'aws',
  [
    's3',
    'sync',
    distDir,
    destination,
    '--endpoint-url',
    endpoint,
    '--delete',
    '--exclude',
    '.DS_Store',
    '--exclude',
    'rostech/*',
    '--exclude',
    'npf/*',
  ],
  { stdio: 'inherit', env: awsEnv },
);

if (result.error) {
  console.error(result.error.message);
  console.error('Установи AWS CLI: https://aws.amazon.com/cli/');
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const queryRedirectStubs = [
  { file: 'plan-query-redirect.html', key: 'plan' },
  { file: 'b2c-query-redirect.html', key: 'b2c' },
];

for (const { file, key } of queryRedirectStubs) {
  const redirectHtml = resolve(root, 'scripts', file);
  if (!existsSync(redirectHtml)) continue;
  const redirectTarget = `${destination}${key}`;
  console.log(`Upload redirect: ${redirectHtml} → ${redirectTarget}`);
  const redirectResult = spawnSync(
    'aws',
    [
      's3',
      'cp',
      redirectHtml,
      redirectTarget,
      '--endpoint-url',
      endpoint,
      '--content-type',
      'text/html; charset=utf-8',
      '--cache-control',
      'no-cache',
    ],
    { stdio: 'inherit', env: awsEnv },
  );
  if (redirectResult.status !== 0) {
    process.exit(redirectResult.status ?? 1);
  }
}

/** Constructor widgets: отдельный sync префиксов (main sync их exclude'ит). */
const partnerLanes = ['rostech', 'npf'];
for (const lane of partnerLanes) {
  const laneDir = resolve(distDir, lane);
  const laneIndex = resolve(laneDir, 'index.html');
  if (!existsSync(laneIndex)) {
    console.warn(
      `Пропуск ${lane}/: нет dist/${lane}/index.html (сначала npm run build)`,
    );
    continue;
  }
  const laneDest = `${destination}${lane}/`;
  console.log(`Синхронизация partner-widget ${laneDir} → ${laneDest}`);
  const laneResult = spawnSync(
    'aws',
    [
      's3',
      'sync',
      laneDir,
      laneDest,
      '--endpoint-url',
      endpoint,
      '--delete',
      '--exclude',
      '.DS_Store',
    ],
    { stdio: 'inherit', env: awsEnv },
  );
  if (laneResult.status !== 0) {
    process.exit(laneResult.status ?? 1);
  }
}

process.exit(0);
