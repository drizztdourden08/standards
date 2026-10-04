/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const packageFileUp = (name, file) => {
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    const pkgFile = join(dir, 'package.json');
    if (existsSync(pkgFile) && JSON.parse(readFileSync(pkgFile, 'utf8')).name === name) return pkgFile;
  }
  return null;
};

const packageFileOf = (name, dir) => {
  const require = createRequire(join(dir, 'package.json'));
  try {
    return require.resolve(`${name}/package.json`);
  } catch {
    return packageFileUp(name, require.resolve(name));
  }
};

const binIn = (name, pkgFile) => {
  const { bin } = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const entry = typeof bin === 'string' ? bin : bin?.[name] ?? Object.values(bin ?? {})[0];
  return entry ? resolve(dirname(pkgFile), entry) : null;
};

/**
 * @param {string} name package name
 * @param {string[]} fromDirs folders to resolve it from, in order
 * @returns {string | null} the path of its bin script
 */
const binOf = (name, fromDirs) => {
  for (const dir of fromDirs) {
    try {
      const pkgFile = packageFileOf(name, dir);
      const bin = pkgFile ? binIn(name, pkgFile) : null;
      if (bin) return bin;
    } catch {
      continue;
    }
  }
  return null;
};

export { binOf };
