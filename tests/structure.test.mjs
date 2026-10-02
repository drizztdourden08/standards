/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkShapes, collectFindings, structureRules } from '../structure/index.mjs';
import usageFiles from '../extensions/usage-files/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const files = (paths) => Object.fromEntries(paths.map((path) => [path, '']));

const BUTTON = ['src/index.ts', 'src/primitives/Button/Button.tsx', 'src/primitives/Button/index.ts'];
const WITH_SUB = [...BUTTON, 'src/primitives/Button/sub-components/ButtonIcon/ButtonIcon.tsx', 'src/primitives/Button/sub-components/ButtonIcon/index.ts'];
const usageRules = structureRules([usageFiles]);

afterEach(removeTempTrees);

describe('component folders', () => {
  it('accepts Name.usage.ts in any component folder without the extension', () => {
    const root = tempTree(files([...BUTTON, 'src/primitives/Button/Button.usage.ts']));
    expect(checkShapes(root, join(root, 'src'))).toEqual([]);
  });

  it('asks nothing of a repo that does not list usage-files', () => {
    const root = tempTree(files(BUTTON));
    expect(checkShapes(root, join(root, 'src'))).toEqual([]);
  });

  it('requires Name.usage.ts with usage-files, outside sub-components only', () => {
    const root = tempTree(files(WITH_SUB));
    expect(checkShapes(root, join(root, 'src'), [], usageRules)).toEqual([
      'src/primitives/Button: missing Button.usage.ts (every design-system component documents when to use it)',
    ]);
  });

  it('passes a component that has its usage file', () => {
    const root = tempTree(files([...WITH_SUB, 'src/primitives/Button/Button.usage.ts']));
    expect(checkShapes(root, join(root, 'src'), [], usageRules)).toEqual([]);
  });

  it('lists the allowed files when a folder holds a stray one', () => {
    const root = tempTree(files([...BUTTON, 'src/primitives/Button/notes.md']));
    expect(checkShapes(root, join(root, 'src'))).toEqual([
      'src/primitives/Button/notes.md: not part of a component folder (Button.tsx, index.ts, Button.css, Button.type.ts, Button.constants.ts, Button.usage.ts, behavior/, sub-components/)',
    ]);
  });

  it('allows a component file an extension adds', () => {
    const root = tempTree(files([...BUTTON, 'src/primitives/Button/Button.story.ts']));
    const rules = structureRules([{ id: 'stories', structure: { componentFiles: [{ file: '{Name}.story.ts' }] } }]);
    expect(checkShapes(root, join(root, 'src'), [], rules)).toEqual([]);
  });
});

describe('module folders', () => {
  it('names the module file forms, with the ones extensions add', () => {
    const root = tempTree(files(['src/index.ts', 'src/boot/theme.task.ts', 'src/boot/Stray File.txt']));
    const rules = structureRules([{ id: 'boot', structure: { moduleFiles: [{ pattern: /^[a-z][a-z0-9-]*\.task\.ts$/, label: '<id>.task.ts' }] } }]);
    expect(checkShapes(root, join(root, 'src'), [], rules)).toEqual([
      'src/boot/Stray File.txt: a module file is kebab-case.ts, <subject>.type.ts, <subject>.constants.ts, <id>.task.ts or index.ts',
    ]);
  });

  it('takes a bare RegExp as a module file pattern', () => {
    const rules = structureRules([{ id: 'bare', structure: { moduleFiles: [/^x\.ts$/] } }]);
    expect(rules.moduleFiles).toEqual([{ pattern: /^x\.ts$/ }]);
  });
});

describe('collectFindings', () => {
  it('checks names, barrels, generic folders and depth', async () => {
    const root = tempTree({
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      'packages/a/package.json': { name: 'wrong-name' },
      'packages/a/src/utils/x.ts': '',
      'packages/b/package.json': { name: '@acme/b', exports: { '.': './src/missing.ts' } },
      'packages/b/src/one/two/three/four/five/six/x.ts': '',
    });
    const { findings } = await collectFindings(root, '@acme');
    expect(findings).toEqual([
      'packages/a: name "wrong-name" is not "@acme/<subject>"',
      'packages/a: no exports; a package has one public barrel',
      'packages/a/src/utils: folder "utils" names a layer, not a subject',
      'packages/b: exports points at ./src/missing.ts, which does not exist',
      'packages/b/src/one/two/three/four/five/six: deeper than 5 levels below src',
    ]);
  });

  it('skips the folders an extension owns and runs its checks with the package kind', async () => {
    const root = tempTree({
      'app.marker': '',
      'package.json': { name: 'app' },
      'src/main.tsx': '',
      'src/screens/Weird Name.txt': '',
    });
    const seen = [];
    const extension = {
      id: 'owner',
      structure: {
        appMarkers: ['app.marker'],
        ownedDirs: (dir) => [join(dir, 'src', 'screens')],
        checks: [(ctx) => { seen.push(`${ctx.label} ${ctx.kind}`); return []; }],
      },
    };
    const { findings, counted } = await collectFindings(root, '@app', [extension]);
    expect({ findings, counted, seen }).toEqual({ findings: [], counted: 1, seen: ['. app'] });
  });

  it('checks a single-package repo as one package', async () => {
    const root = tempTree({ 'package.json': { name: '@acme/solo', exports: './src/index.ts' }, 'src/index.ts': '' });
    expect(await collectFindings(root, '@acme')).toEqual({ findings: [], notes: [], counted: 1 });
  });
});
