/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadStandards } from '../config/load.mjs';
import { facetsOf } from '../config/merge.mjs';
import { checkShapes } from './shape.mjs';
import { packageProblems, resolveScope, scopeOf } from './package-checks.mjs';
import { workspaceDirs, workspaceGlobs, globBase, expandGlob } from './workspace.mjs';
import { APP_FOLDER, GENERIC_FOLDERS, MAX_DEPTH_BELOW_SRC, WALK_SKIP } from './structure.constants.mjs';

const toPosix = (path) => path.replace(/\\/g, '/');
const labelOf = (rootDir, dir) => toPosix(relative(rootDir, dir)) || '.';

const asModuleFile = (entry) => (entry instanceof RegExp ? { pattern: entry } : entry);

/**
 * @param {Record<string, any>[]} extensions
 * @returns {{ componentFiles: object[], moduleFiles: { pattern: RegExp, label?: string }[], ownedDirs: Function[], checks: Function[], appMarkers: string[] }}
 */
const structureRules = (extensions) => {
  const facets = facetsOf(extensions, 'structure');
  const all = (key) => facets.flatMap((facet) => facet[key] ?? []);
  return {
    componentFiles: all('componentFiles'),
    moduleFiles: all('moduleFiles').map(asModuleFile),
    ownedDirs: facets.map((facet) => facet.ownedDirs).filter(Boolean),
    checks: all('checks'),
    appMarkers: all('appMarkers'),
  };
};

const walk = (dir, visit, depth = 0) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || WALK_SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    visit(full, entry.name, depth + 1);
    walk(full, visit, depth + 1);
  }
};

const folderFindings = (rootDir, src) => {
  const findings = [];
  walk(src, (full, name, depth) => {
    const at = toPosix(relative(rootDir, full));
    if (GENERIC_FOLDERS.has(name)) findings.push(`${at}: folder "${name}" names a layer, not a subject`);
    if (depth > MAX_DEPTH_BELOW_SRC) findings.push(`${at}: deeper than ${MAX_DEPTH_BELOW_SRC} levels below src`);
  });
  return findings;
};

const runChecks = async (rules, ctx, out) => {
  for (const check of rules.checks) {
    const result = await check(ctx);
    const { findings = [], notes = [] } = Array.isArray(result) ? { findings: result } : result ?? {};
    out.findings.push(...findings);
    out.notes.push(...notes);
  }
};

const checkSrc = async (rules, ctx, out) => {
  const src = join(ctx.packageDir, 'src');
  if (existsSync(src)) {
    out.findings.push(...folderFindings(ctx.rootDir, src));
    const hasEntry = existsSync(join(src, 'index.ts')) || existsSync(join(src, 'main.tsx'));
    if (hasEntry) out.findings.push(...checkShapes(ctx.rootDir, src, rules.ownedDirs.flatMap((owned) => owned(ctx.packageDir)), rules));
  }
  await runChecks(rules, ctx, out);
};

const isAppDir = (dir, label, rules) => label.startsWith(APP_FOLDER) || rules.appMarkers.some((marker) => existsSync(join(dir, marker)));

const readPackage = (dir) => {
  const file = join(dir, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
};

const checkPackage = async (rules, { rootDir, dir, scope }, out) => {
  const label = labelOf(rootDir, dir);
  const pkg = readPackage(dir);
  if (!pkg) { out.findings.push(`${label}: no package.json; every workspace folder is a package`); return; }
  const kind = isAppDir(dir, label, rules) ? 'app' : 'package';
  if (kind === 'package') out.findings.push(...packageProblems(dir, label, pkg, scope));
  await checkSrc(rules, { rootDir, packageDir: dir, label, pkg, kind }, out);
};

const rootKind = (rootDir, dirs, rules) => {
  if (rules.appMarkers.some((marker) => existsSync(join(rootDir, marker)))) return 'app';
  if (!dirs.length && existsSync(join(rootDir, 'src'))) return 'package';
  return null;
};

/**
 * @param {string} rootDir
 * @param {string} scope
 * @param {Record<string, any>[]} [extensions]
 * @returns {Promise<{ findings: string[], notes: string[], counted: number }>}
 */
const collectFindings = async (rootDir, scope, extensions = []) => {
  const rules = structureRules(extensions);
  const out = { findings: [], notes: [] };
  const { dirs, declared } = workspaceDirs(rootDir);
  const kind = rootKind(rootDir, dirs, rules);
  if (kind === 'app') await checkSrc(rules, { rootDir, packageDir: rootDir, label: '.', pkg: readPackage(rootDir) ?? {}, kind }, out);
  else if (kind === 'package') await checkPackage(rules, { rootDir, dir: rootDir, scope }, out);
  else if (!dirs.length && !declared) out.findings.push('no workspace folders found (apps/*, packages/*, tooling/* or pnpm-workspace.yaml)');
  for (const dir of dirs) await checkPackage(rules, { rootDir, dir, scope }, out);
  return { ...out, counted: dirs.length + (kind ? 1 : 0) };
};

/**
 * @param {{ rootDir: string, scope?: string, label?: string, presets?: string[], extensions?: unknown[] }} ctx
 * @returns {Promise<number>} exit code
 */
const runStructure = async ({ rootDir, scope: explicitScope, label = 'standards structure', presets, extensions }) => {
  const loaded = loadStandards({ rootDir, presets, extensions });
  const scope = resolveScope(rootDir, explicitScope ?? loaded.options.scope);
  const { findings, notes, counted } = await collectFindings(rootDir, scope, loaded.extensions);
  for (const note of notes) console.log(`${label}: ${note}`);
  if (!findings.length) {
    console.log(`${label}: ${counted} package(s) under ${scope}, no findings.`);
    return 0;
  }
  console.error(`${label}: ${findings.length} finding(s) under ${scope}:`);
  for (const f of findings) console.error(`  ${f}`);
  return 1;
};

export { runStructure, collectFindings, structureRules, checkShapes, scopeOf, resolveScope, workspaceGlobs, workspaceDirs, globBase, expandGlob };
