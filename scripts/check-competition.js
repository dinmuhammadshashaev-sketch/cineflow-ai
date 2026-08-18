import fs from 'fs';
import path from 'path';

console.log('🏆 Running CineFlow Competition Compliance Check...');

const FORBIDDEN_PACKAGES = [
  'openai',
  '@anthropic-ai/sdk',
  'anthropic',
  'langchain',
  '@langchain/core',
  'langgraph',
  'crewai',
  '@mistralai/mistralai',
  '@aws-sdk/client-bedrock-runtime',
  '@azure/openai'
];

const FORBIDDEN_CODE_PATTERNS = [
  /from ['"]openai['"]/,
  /require\(['"]openai['"]\)/,
  /from ['"]@anthropic-ai\/sdk['"]/,
  /from ['"]langchain['"]/,
  /from ['"]langgraph['"]/,
  /from ['"]crewai['"]/
];

const errors = [];

// 1. Check LICENSE file
const licensePath = path.join(process.cwd(), 'LICENSE');
if (!fs.existsSync(licensePath)) {
  errors.push('Missing LICENSE file at project root.');
} else {
  const licenseContent = fs.readFileSync(licensePath, 'utf-8');
  if (licenseContent.length < 500) {
    errors.push('LICENSE file is empty or incomplete (must be > 500 bytes).');
  }
  if (!licenseContent.includes('Apache License') && !licenseContent.includes('MIT License') && !licenseContent.includes('BSD')) {
    errors.push('LICENSE file does not identify an OSI-approved license (e.g. Apache License 2.0).');
  }
}

// 2. Check package.json dependencies
const pkgPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  errors.push('Missing package.json file.');
} else {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };

  if (!allDeps['@google/adk']) {
    errors.push('Required dependency @google/adk is missing from package.json.');
  }

  if (!allDeps['@google/genai']) {
    errors.push('Required dependency @google/genai is missing from package.json.');
  }

  FORBIDDEN_PACKAGES.forEach((forbidden) => {
    if (allDeps[forbidden]) {
      errors.push(`Prohibited AI dependency found in package.json: ${forbidden}`);
    }
  });
}

// 3. Verify ADK & Parallel Search Real Runtime Requirements
const runnerPath = path.join(process.cwd(), 'server/agents/cineflow/runner.ts');
if (!fs.existsSync(runnerPath)) {
  errors.push('Missing server/agents/cineflow/runner.ts');
} else {
  const runnerContent = fs.readFileSync(runnerPath, 'utf-8');
  if (!runnerContent.includes('InMemoryRunner') && !runnerContent.includes('Runner')) {
    errors.push('runner.ts does not instantiate InMemoryRunner / Runner.');
  }
  if (!runnerContent.includes('runAsync')) {
    errors.push('runner.ts does not invoke ADK runAsync.');
  }
  if (!runnerContent.includes('SequentialAgent')) {
    errors.push('runner.ts does not instantiate SequentialAgent.');
  }
}

const toolPath = path.join(process.cwd(), 'server/agents/cineflow/parallelSearchTool.ts');
if (!fs.existsSync(toolPath)) {
  errors.push('Missing server/agents/cineflow/parallelSearchTool.ts');
} else {
  const toolContent = fs.readFileSync(toolPath, 'utf-8');
  if (!toolContent.includes('FunctionTool')) {
    errors.push('parallelSearchTool.ts does not construct a FunctionTool.');
  }
  if (!toolContent.includes('parameters')) {
    errors.push('parallelSearchTool.ts does not specify parameters schema on FunctionTool.');
  }
}

// 4. Scan source files for forbidden AI imports
function scanDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      FORBIDDEN_CODE_PATTERNS.forEach((pattern) => {
        if (pattern.test(content)) {
          errors.push(`Prohibited AI provider pattern ${pattern} found in ${path.relative(process.cwd(), fullPath)}`);
        }
      });
    }
  }
}

scanDir(process.cwd());

if (errors.length > 0) {
  console.error('\n❌ COMPETITION COMPLIANCE CHECK FAILED:\n');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Competition compliance check passed! Only Gemini + Google ADK + Parallel Search are present and active.');
  process.exit(0);
}
