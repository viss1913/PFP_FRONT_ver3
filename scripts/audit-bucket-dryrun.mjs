/**
 * Сверка dist/ с бакетом Yandex (aws s3 sync --dryrun).
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
  console.error('dist/ не найден. Запусти: npm run build');
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

console.log(`Dry-run: ${distDir} ↔ ${destination}`);
console.log(`Endpoint: ${endpoint}\n`);

const result = spawnSync(
  'aws',
  [
    's3',
    'sync',
    distDir,
    destination,
    '--endpoint-url',
    endpoint,
    '--dryrun',
    '--exclude',
    '.DS_Store',
  ],
  { encoding: 'utf8', env: awsEnv },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
if (output.trim()) {
  process.stdout.write(output);
}

const dryrunLines = output
  .split(/\r?\n/)
  .filter((line) => line.includes('(dryrun)'));

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

if (dryrunLines.length > 0) {
  console.error(
    `\n[WARN] Бакет отличается от dist/: ${dryrunLines.length} изменений. Запусти: npm run deploy:yandex`,
  );
  process.exit(2);
}

console.log('\n[OK] Локальный dist совпадает с бакетом (dry-run без изменений).');
process.exit(0);
