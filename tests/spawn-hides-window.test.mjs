/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER, lint } from './lint-text.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const hideMessages = async (body) => {
  const root = tempTree({ 'package.json': { name: 'x' } });
  const messages = await lint(root, 'run.mjs', `${HEADER}${body}\n`);
  return messages.filter((message) => message.startsWith('local/spawn-hides-window'));
};

describe('local/spawn-hides-window', { tags: ['standard'] }, () => {
  it('reports a call whose options object lacks windowsHide', async () => {
    const found = await hideMessages("import { spawn } from 'node:child_process';\nspawn('git', [], { cwd: '.' });\n\nexport { spawn };");
    expect(found).toHaveLength(1);
    expect(found[0]).toMatch(/Pass windowsHide to spawn/);
  });

  it('passes windowsHide true', async () => {
    const found = await hideMessages("import { execFileSync } from 'node:child_process';\nexecFileSync('git', [], { windowsHide: true });\n\nexport { execFileSync };");
    expect(found).toEqual([]);
  });

  it('passes windowsHide false for a GUI app', async () => {
    const found = await hideMessages("import { spawn } from 'child_process';\nspawn('app', [], { windowsHide: false });\n\nexport { spawn };");
    expect(found).toEqual([]);
  });

  it('reports a spread object with no windowsHide key', async () => {
    const found = await hideMessages("import { spawn } from 'child_process';\nconst base = { windowsHide: true };\nspawn('app', [], { ...base });\n\nexport { spawn };");
    expect(found).toHaveLength(1);
  });

  it('reports a call through a namespace import', async () => {
    const found = await hideMessages("import * as cp from 'node:child_process';\ncp.execSync('ls');\n\nexport { cp };");
    expect(found).toHaveLength(1);
  });
});
