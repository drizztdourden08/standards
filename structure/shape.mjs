/* @layer tooling-scripts @kind logic */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { CORE_COMPONENT_FILES, COMPONENT_DIRS, CORE_MODULE_LABELS, CORE_MODULE_FILE, BEHAVIOR_FILE, SUB_COMPONENT_FILE, SHAPE_SKIP } from './structure.constants.mjs';

const entriesOf = (dir) => readdirSync(dir).filter((name) => !SHAPE_SKIP.has(name));
const isDir = (path) => statSync(path).isDirectory();
const isComponentFolder = (dir) => existsSync(join(dir, `${basename(dir)}.tsx`));
const named = (file, name) => file.replaceAll('{Name}', name);

const checkBehavior = (dir, label) =>
  entriesOf(dir).filter((name) => !BEHAVIOR_FILE.test(name)).map((name) => `${label}/behavior/${name}: a behavior file is useThing.ts or a kebab-case pure function`);

const checkSubComponents = (dir, label, rules) => {
  const findings = [];
  for (const name of entriesOf(dir)) {
    const path = join(dir, name);
    if (isDir(path)) findings.push(...(isComponentFolder(path) ? checkComponentFolder(path, `${label}/sub-components/${name}`, rules, false) : [`${label}/sub-components/${name}: a folder here is a component folder (${name}/${name}.tsx)`]));
    else if (!SUB_COMPONENT_FILE.test(name)) findings.push(`${label}/sub-components/${name}: a flat sub-component is Name.tsx with Name.type.ts, Name.constants.ts or Name.css beside it; behavior/ or sub-components/ of its own make it a folder`);
  }
  return findings;
};

const allowedIn = (name, rules) => [...new Set([
  `${name}.tsx`,
  'index.ts',
  ...[...CORE_COMPONENT_FILES, ...rules.componentFiles.map((entry) => entry.file)].map((file) => named(file, name)),
])];

const missingRequired = (name, entries, label, rules) =>
  rules.componentFiles
    .filter((entry) => entry.required && !entries.includes(named(entry.file, name)))
    .map((entry) => `${label}: missing ${named(entry.file, name)}${entry.reason ? ` (${entry.reason})` : ''}`);

const checkComponentFolder = (dir, label, rules, top) => {
  const name = basename(dir);
  const files = allowedIn(name, rules);
  const allowed = new Set([...files, ...COMPONENT_DIRS]);
  const listed = [...files, ...COMPONENT_DIRS.map((folder) => `${folder}/`)].join(', ');
  const entries = entriesOf(dir);
  const findings = entries.filter((e) => !allowed.has(e)).map((e) => `${label}/${e}: not part of a component folder (${listed})`);
  if (!entries.includes('index.ts')) findings.push(`${label}: missing index.ts`);
  if (top) findings.push(...missingRequired(name, entries, label, rules));
  if (entries.includes('behavior')) findings.push(...checkBehavior(join(dir, 'behavior'), label));
  if (entries.includes('sub-components')) findings.push(...checkSubComponents(join(dir, 'sub-components'), label, rules));
  return findings;
};

const moduleLabels = (rules) => [...CORE_MODULE_LABELS, ...rules.moduleFiles.map((entry) => entry.label).filter(Boolean)].join(', ');

const isModuleFile = (name, rules) => CORE_MODULE_FILE.test(name) || rules.moduleFiles.some((entry) => entry.pattern.test(name));

const checkModuleFolder = (dir, label, rules) =>
  entriesOf(dir)
    .filter((name) => !isDir(join(dir, name)) && !isModuleFile(name, rules))
    .map((name) => `${label}/${name}: a module file is ${moduleLabels(rules)} or index.ts`);

const walk = (rootDir, dir, findings, options) => {
  if (options.skip.has(dir)) return;
  const label = relative(rootDir, dir).replace(/\\/g, '/');
  if (isComponentFolder(dir)) { findings.push(...checkComponentFolder(dir, label, options.rules, true)); return; }
  findings.push(...checkModuleFolder(dir, label, options.rules));
  for (const name of entriesOf(dir)) {
    const path = join(dir, name);
    if (isDir(path)) walk(rootDir, path, findings, options);
  }
};

/**
 * @param {string} rootDir
 * @param {string} srcDir
 * @param {string[]} [skipDirs] folders an extension checks itself
 * @param {{ componentFiles?: object[], moduleFiles?: object[] }} [rules] from the extensions
 * @returns {string[]}
 */
const checkShapes = (rootDir, srcDir, skipDirs = [], rules = {}) => {
  const findings = [];
  const merged = { componentFiles: rules.componentFiles ?? [], moduleFiles: rules.moduleFiles ?? [] };
  if (existsSync(srcDir)) walk(rootDir, srcDir, findings, { skip: new Set(skipDirs), rules: merged });
  return findings;
};

export { checkShapes };
