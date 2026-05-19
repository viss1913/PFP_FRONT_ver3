import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './load-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

if (!existsSync(envPath)) {
  console.error('.env не найден');
  process.exit(1);
}

const fileEnv = loadEnvFile(envPath);
const bucket = fileEnv.BUCKET_NAME;
const missing = ['BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter(
  (k) => !fileEnv[k]?.trim(),
);
if (missing.length) {
  console.error('В .env не задано:', missing.join(', '));
  process.exit(1);
}

const awsEnv = {
  ...process.env,
  AWS_ACCESS_KEY_ID: fileEnv.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: fileEnv.AWS_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION: 'ru-central1',
};

const r = spawnSync(
  'aws',
  ['s3', 'ls', `s3://${bucket}/`, '--endpoint-url', 'https://storage.yandexcloud.net'],
  { stdio: 'inherit', env: awsEnv },
);
process.exit(r.status ?? 1);
