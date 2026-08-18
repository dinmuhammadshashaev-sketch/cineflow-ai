import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Secret Scanner Verification', () => {
  it('passes on safe project repository files', () => {
    let error: any = null;
    let output = '';
    try {
      output = execSync('node scripts/scan-secrets.js', { encoding: 'utf-8' });
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeNull();
    expect(output).toContain('Secret scan clean');
  });

  it('detects fake secret in temporary test fixture and cleans up fixture', () => {
    const fixturePath = path.join(process.cwd(), 'temp_secret_fixture.txt');
    const fakeKeyLine = ['PARALLEL', '_API_KEY=sk_fake_secret_value_1234567890'].join('');
    fs.writeFileSync(fixturePath, `${fakeKeyLine}\n`);

    let failedAsExpected = false;
    try {
      execSync('node scripts/scan-secrets.js', { encoding: 'utf-8', stdio: 'pipe' });
    } catch (err: any) {
      failedAsExpected = true;
      const stdout = err.stdout?.toString() || '';
      const stderr = err.stderr?.toString() || '';
      const fullOutput = stdout + stderr;
      expect(fullOutput).toContain('SECRET SCANNER FAILED');
      expect(fullOutput).toContain('temp_secret_fixture.txt');
    } finally {
      if (fs.existsSync(fixturePath)) {
        fs.unlinkSync(fixturePath);
      }
    }

    expect(failedAsExpected).toBe(true);
    expect(fs.existsSync(fixturePath)).toBe(false);
  });
});
