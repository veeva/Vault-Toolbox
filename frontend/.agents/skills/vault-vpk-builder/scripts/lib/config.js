import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_FIELDS = ['summary', 'author'];

export function loadConfig(name, cwd = process.cwd()) {
  const configPath = resolve(cwd, 'vpk.config.json');
  if (!existsSync(configPath)) {
    throw new Error(`Config error: vpk.config.json not found at ${configPath}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Config error: vpk.config.json is not valid JSON: ${err.message}`);
  }

  if (!parsed.packages || !parsed.packages[name]) {
    throw new Error(`Config error: package '${name}' not found in vpk.config.json`);
  }

  const spec = parsed.packages[name];

  for (const field of REQUIRED_FIELDS) {
    if (!spec[field]) {
      throw new Error(`Config error: ${name} missing '${field}'`);
    }
  }

  if (!Array.isArray(spec.components) || spec.components.length === 0) {
    throw new Error(`Config error: ${name}.components must be a non-empty array`);
  }

  return { name, ...spec };
}