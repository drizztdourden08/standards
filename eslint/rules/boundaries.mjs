/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

const GENERIC_FOLDERS = new Set(['lib', 'utils', 'helpers', 'misc', 'common']);
const packageDirCache = new Map();

const packageNameIn = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8')).name ?? null;
  } catch {
    return null;
  }
};

const nearestPackage = (fromDir) => {
  let dir = fromDir;
  for (;;) {
    if (packageDirCache.has(dir)) return packageDirCache.get(dir);
    const file = resolve(dir, 'package.json');
    if (existsSync(file)) {
      const found = { dir, name: packageNameIn(file) };
      packageDirCache.set(dir, found);
      return found;
    }
    const parent = dirname(dir);
    if (parent === dir) { packageDirCache.set(dir, null); return null; }
    dir = parent;
  }
};

const sourceOf = (node) => {
  if (node.type === 'ImportExpression') return node.source?.type === 'Literal' ? node.source.value : null;
  return node.source?.value ?? null;
};

const isRelative = (spec) => typeof spec === 'string' && (spec.startsWith('./') || spec.startsWith('../'));

const noCrossPackageRelative = {
  meta: { type: 'problem', docs: { description: 'Import another package by its alias, never by a relative path' }, schema: [] },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const own = nearestPackage(dirname(filename));
    const check = (node) => {
      const spec = sourceOf(node);
      if (!own || !isRelative(spec)) return;
      const target = resolve(dirname(filename), spec);
      const theirs = nearestPackage(target.endsWith(sep) ? target : dirname(target)) ?? nearestPackage(target);
      if (!theirs || theirs.dir === own.dir) return;
      const alias = theirs.name ? `'${theirs.name}'` : 'its package name';
      context.report({ node, message: `Relative import leaves the package. Import ${alias} instead.` });
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check };
  },
};

const noDeepPackageImport = {
  meta: { type: 'problem', docs: { description: 'Import a package through its barrel, never through its src folder' }, schema: [] },
  create(context) {
    const check = (node) => {
      const spec = sourceOf(node);
      if (typeof spec !== 'string' || !spec.startsWith('@')) return;
      if (/^@[^/]+\/[^/]+\/src(\/|$)/.test(spec)) {
        context.report({ node, message: `Deep import '${spec}'. Import the package barrel, or a subpath it exports.` });
      }
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check };
  },
};

const noGenericFolderNames = {
  meta: { type: 'problem', docs: { description: 'No lib, utils, helpers, misc or common folders: name the subject' }, schema: [] },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename ?? context.getFilename();
        const segments = filename.split(/[\\/]/);
        const src = segments.lastIndexOf('src');
        const below = src === -1 ? [] : segments.slice(src + 1, -1);
        const hit = below.find((s) => GENERIC_FOLDERS.has(s));
        if (hit) context.report({ node, loc: { line: 1, column: 0 }, message: `Folder "${hit}" names a layer, not a subject. Move this file under the subject it serves.` });
      },
    };
  },
};

export { noCrossPackageRelative, noDeepPackageImport, noGenericFolderNames };
