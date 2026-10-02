/* @layer tooling-scripts @kind logic */
import { appendFileSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OWN_ROOT } from '../config/load.mjs';
import { copyFindings, standardsCopies } from './copies.mjs';
import { sharedFileFindings } from './shared-files.mjs';

const MISSING_LINE = /^\.npmrc: missing the line "(.+)"$/;

const writeMissing = (rootDir, findings) => {
  const npmrc = join(rootDir, '.npmrc');
  const missing = findings.map((finding) => MISSING_LINE.exec(finding)?.[1]).filter(Boolean);
  if (!existsSync(npmrc)) copyFileSync(join(OWN_ROOT, 'templates', 'npmrc'), npmrc);
  else if (missing.length) {
    const lead = readFileSync(npmrc, 'utf8').endsWith('\n') ? '' : '\n';
    appendFileSync(npmrc, `${lead}${missing.join('\n')}\n`);
  }
  if (!existsSync(join(rootDir, '.jscpd.json'))) copyFileSync(join(OWN_ROOT, 'jscpd', 'base.json'), join(rootDir, '.jscpd.json'));
};

/**
 * @param {{ rootDir: string, check?: boolean, label?: string }} ctx
 * @returns {number} exit code
 */
const runSync = ({ rootDir, check = false, label = 'standards sync' }) => {
  const files = sharedFileFindings(rootDir);
  if (!check) {
    writeMissing(rootDir, files);
    const left = sharedFileFindings(rootDir);
    for (const finding of left) console.log(`${label}: ${finding}`);
    console.log(`${label}: wrote the missing .npmrc lines and .jscpd.json; ${left.length} difference(s) left to merge by hand.`);
    return 0;
  }
  const findings = [...files, ...copyFindings(rootDir)];
  for (const finding of findings) console.error(`${label}: ${finding}`);
  if (findings.length) return 1;
  console.log(`${label}: shared files match the templates, one copy of @drizztdourden08/standards.`);
  return 0;
};

export { runSync, sharedFileFindings, copyFindings, standardsCopies };
