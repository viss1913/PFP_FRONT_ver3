/**
 * Заливка только dist/rostech и dist/npf (без полного SPA sync).
 */
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './load-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const fileEnv = loadEnvFile(resolve(root, '.env'));
const env = { ...process.env, ...fileEnv };
const bucket = env.BUCKET_NAME?.trim();
const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
const endpoint = env.YC_S3_ENDPOINT?.trim() || 'https://storage.yandexcloud.net';

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error('Нет AWS/BUCKET в .env');
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

const destination = `s3://${bucket}/`;

for (const lane of ['rostech', 'npf']) {
  const laneDir = resolve(distDir, lane);
  if (!existsSync(resolve(laneDir, 'index.html'))) {
    console.error(`нет dist/${lane}/index.html`);
    process.exit(1);
  }
  const laneDest = `${destination}${lane}/`;
  console.log(`sync ${laneDir} → ${laneDest}`);
  const r = spawnSync(
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
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('OK partner widgets uploaded');
