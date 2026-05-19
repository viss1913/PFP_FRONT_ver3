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
  ],
  { stdio: 'inherit', env: awsEnv },
);

if (result.error) {
  console.error(result.error.message);
  console.error('Установи AWS CLI: https://aws.amazon.com/cli/');
  process.exit(1);
}

process.exit(result.status ?? 1);
