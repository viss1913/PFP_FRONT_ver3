/**
 * Генерация иллюстрации для блока статистики через OpenRouter (Gemini image).
 *
 * В .env:
 *   OPENROUTER_API_KEY=sk-or-...
 *   OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image-preview  (опционально)
 *
 * После успеха добавь в .env:
 *   VITE_LANDING_STATS_IMAGE=/landing/stats-illustration.png
 *
 * Запуск: npm run generate:landing-stats-image
 * Свой промпт: npm run generate:landing-stats-image -- "your prompt"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outFile = path.join(root, 'public', 'landing', 'stats-illustration.png');

function loadEnvFile() {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
    }
}

loadEnvFile();

const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
const model =
    process.env.OPENROUTER_IMAGE_MODEL ||
    process.env.VITE_OPENROUTER_IMAGE_MODEL ||
    'google/gemini-2.5-flash-image-preview';

const defaultPrompt =
    'Premium minimalist fintech illustration for a family office platform. Dark forest green background, subtle gold accents, abstract rising wealth chart, modern office building silhouette, protection shield motif. No text, no people faces, no logos. Elegant, cinematic lighting, 4:3 aspect ratio.';

const userPrompt = process.argv.slice(2).join(' ').trim() || defaultPrompt;

if (!apiKey) {
    console.error('❌ Нужен OPENROUTER_API_KEY (или VITE_OPENROUTER_API_KEY) в .env');
    process.exit(1);
}

console.log(`Model: ${model}`);
console.log(`Prompt: ${userPrompt.slice(0, 120)}…`);

const body = {
    model,
    messages: [{ role: 'user', content: userPrompt }],
    modalities: ['image', 'text'],
};

const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bankfuture.local',
        'X-Title': 'BankFuture Landing',
    },
    body: JSON.stringify(body),
});

const json = await res.json();

if (!res.ok) {
    console.error('OpenRouter error:', JSON.stringify(json, null, 2));
    process.exit(1);
}

function collectImages(node, acc = []) {
    if (!node || typeof node !== 'object') return acc;
    if (Array.isArray(node)) {
        for (const item of node) collectImages(item, acc);
        return acc;
    }
    if (node.type === 'image_url' && node.image_url?.url) {
        acc.push(node.image_url.url);
    }
    if (typeof node.url === 'string' && node.url.startsWith('data:image')) {
        acc.push(node.url);
    }
    if (typeof node.b64_json === 'string') {
        acc.push(`data:image/png;base64,${node.b64_json}`);
    }
    for (const v of Object.values(node)) collectImages(v, acc);
    return acc;
}

const message = json.choices?.[0]?.message;
const images = collectImages(message);

if (!images.length) {
    console.error('В ответе нет картинки. Проверь модель (image-capable) и modalities.');
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
}

const dataUrl = images[0];
const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
if (!match) {
    console.error('Неожиданный формат изображения:', dataUrl.slice(0, 80));
    process.exit(1);
}

const buffer = Buffer.from(match[2], 'base64');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, buffer);

console.log(`✅ Сохранено: ${path.relative(root, outFile)} (${(buffer.length / 1024).toFixed(1)} KB)`);
console.log('');
console.log('Добавь в .env:');
console.log('VITE_LANDING_STATS_IMAGE=/landing/stats-illustration.png');
