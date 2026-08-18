import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.vite'
]);

const IGNORED_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
  '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.mov'
]);

const PLACEHOLDERS = new Set([
  'YOUR_GEMINI_API_KEY',
  'YOUR_PARALLEL_API_KEY',
  'GEMINI_API_KEY',
  'PARALLEL_API_KEY',
  'process.env.GEMINI_API_KEY',
  'process.env.PARALLEL_API_KEY',
  '""',
  "''",
  'undefined',
  'null',
  'CONFIGURED',
  'UNCONFIGURED',
  'YOUR_GEMINI_API_KEY_HERE',
  'YOUR_PARALLEL_API_KEY_HERE'
]);

function redact(val) {
  if (!val || val.length <= 8) return '****';
  return val.slice(0, 4) + '...' + val.slice(-4);
}

// Helper to check if string looks like an environment variable access or placeholder
function isSafeValue(val) {
  if (!val) return true;
  const clean = val.trim().replace(/^["']|["']$/g, '');
  if (clean.length === 0) return true;
  if (PLACEHOLDERS.has(clean)) return true;
  if (clean.startsWith('YOUR_') || clean.startsWith('YOUR-')) return true;
  if (clean.startsWith('process.env.')) return true;
  if (clean.startsWith('import.meta.env.')) return true;
  return false;
}

function scanFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Google AI API Key Pattern
    const gkeyMatch = line.match(/\b(AIzaSy[0-9A-Za-z-_]{33})\b/);
    if (gkeyMatch) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'Google AI API Key',
        redacted: redact(gkeyMatch[1])
      });
    }

    // 2. OpenAI / Generic Secret Key Pattern
    const skMatch = line.match(/\b(sk-[0-9A-Za-z-_]{20,})\b/);
    if (skMatch) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'OpenAI / Secret Key Pattern',
        redacted: redact(skMatch[1])
      });
    }

    // 3. GitHub Tokens Pattern
    const ghPatMatch = line.match(/\b(ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{22,})\b/);
    if (ghPatMatch) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'GitHub Access Token',
        redacted: redact(ghPatMatch[1])
      });
    }

    // 4. Private Key Header Pattern
    const pemRegex = new RegExp('-{5}BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-{5}');
    if (pemRegex.test(line)) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'Private Key Header',
        redacted: '-----BEGIN...PRIVATE KEY-----'
      });
    }

    // 5. Hardcoded PARALLEL_API_KEY Assignment
    const parAssignment = line.match(/PARALLEL_API_KEY\s*[:=]\s*["']?([^"'\s#;]+)["']?/);
    if (parAssignment && parAssignment[1]) {
      const val = parAssignment[1].trim();
      if (!isSafeValue(val)) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: 'Hardcoded PARALLEL_API_KEY Assignment',
          redacted: redact(val)
        });
      }
    }

    // 6. Hardcoded GEMINI_API_KEY Assignment
    const gemAssignment = line.match(/GEMINI_API_KEY\s*[:=]\s*["']?([^"'\s#;]+)["']?/);
    if (gemAssignment && gemAssignment[1]) {
      const val = gemAssignment[1].trim();
      if (!isSafeValue(val)) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: 'Hardcoded GEMINI_API_KEY Assignment',
          redacted: redact(val)
        });
      }
    }

    // 7. Generic Key Assignment (e.g. x-api-key, apiKey, secret, token with high-entropy literal)
    const genKeyMatch = line.match(/(?:x-api-key|apiKey|api_key|authorization|secret)\s*[:=]\s*["']([^"'\s]{16,})["']/i);
    if (genKeyMatch && genKeyMatch[1]) {
      const val = genKeyMatch[1].trim();
      if (!isSafeValue(val)) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: 'Hardcoded Secret Literal',
          redacted: redact(val)
        });
      }
    }
  });

  return violations;
}

function scanDir(dirPath) {
  let allViolations = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        allViolations = allViolations.concat(scanDir(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!IGNORED_EXTS.has(ext) && entry.name !== 'package-lock.json') {
        allViolations = allViolations.concat(scanFile(relativePath));
      }
    }
  }

  return allViolations;
}

console.log('🔒 Starting CineFlow Secret Scanner...');
const violations = scanDir(process.cwd());

if (violations.length > 0) {
  console.error('\n❌ SECRET SCANNER FAILED! Detected potential secrets:\n');
  violations.forEach((v) => {
    console.error(`  - File: ${v.file}:${v.line}`);
    console.error(`    Type: ${v.type}`);
    console.error(`    Value: ${v.redacted}\n`);
  });
  process.exit(1);
} else {
  console.log('✅ Secret scan clean. No hardcoded secrets found.');
  process.exit(0);
}
