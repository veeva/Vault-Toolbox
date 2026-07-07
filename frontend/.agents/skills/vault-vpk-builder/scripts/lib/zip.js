import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

export function zipPackage(buildDir, vpkPath) {
  if (!existsSync(buildDir)) {
    throw new Error(`zip: buildDir does not exist: ${buildDir}`);
  }

  mkdirSync(dirname(vpkPath), { recursive: true });
  rmSync(vpkPath, { force: true });

  try {
    execFileSync('zip', ['-rq', vpkPath, '.'], {
      cwd: buildDir,
      stdio: 'pipe',
    });
  } catch (err) {
    throw new Error(
      `zip: system 'zip' command failed (${err.message}). Install 'zip' or wire the pure-Node fallback.`
    );
  }
}