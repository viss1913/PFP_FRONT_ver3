/**
 * Проверка dist/ после сборки: список файлов и подозрительные паттерны в JS.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');

const SUSPICIOUS_PATTERNS = [
  { name: 'eval(', re: /\beval\s*\(/ },
  { name: 'document.write', re: /document\.write\s*\(/ },
  { name: 'atob(', re: /\batob\s*\(/ },
  { name: 'fromCharCode', re: /fromCharCode/ },
  { name: 'crypto.miner', re: /crypto\.miner/i },
  { name: 'coinhive', re: /coinhive/i },
];

const DISALLOWED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.php',
  '.sh',
  '.dll',
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

if (!existsSync(distDir)) {
  console.error('dist/ не найден. Запусти: npm run build');
  process.exit(1);
}

const files = walk(distDir);
console.log(`Файлов в dist/: ${files.length}\n`);

let hasIssues = false;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    console.error(`[FAIL] Запрещённый тип файла: ${file}`);
    hasIssues = true;
  }
}

const jsFiles = files.filter((f) => f.endsWith('.js'));
console.log('--- Подозрительные паттерны в *.js ---');

for (const file of jsFiles) {
  const content = readFileSync(file, 'utf8');
  const rel = file.replace(distDir, 'dist');
  const hits = SUSPICIOUS_PATTERNS.filter((p) => p.re.test(content));
  if (hits.length) {
    console.log(`${rel}: ${hits.map((h) => h.name).join(', ')}`);
  }
}

if (!jsFiles.some((f) => SUSPICIOUS_PATTERNS.some((p) => p.re.test(readFileSync(f, 'utf8'))))) {
  console.log('(совпадений нет — хорошо)');
}

console.log('\n--- Список файлов ---');
for (const file of files.sort()) {
  const rel = file.replace(root + '\\', '').replace(root + '/', '');
  const size = statSync(file).size;
  console.log(`${rel}\t${size} B`);
}

if (hasIssues) {
  process.exit(1);
}

console.log('\n[OK] audit:dist завершён без критичных находок по типам файлов.');
