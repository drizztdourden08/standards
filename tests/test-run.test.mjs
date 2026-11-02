/* @layer tooling-scripts @kind test */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changedFiles } from '../cli/changed-files.mjs';
import { relatedTests } from '../cli/related-tests.mjs';
import { runTimed } from '../cli/run-timed.mjs';
import { runTest } from '../cli/test.mjs';

vi.mock('../cli/changed-files.mjs', () => ({ changedFiles: vi.fn() }));
vi.mock('../cli/related-tests.mjs', () => ({ relatedTests: vi.fn() }));
vi.mock('../cli/run-timed.mjs', () => ({ runTimed: vi.fn() }));
vi.mock('../cli/bin-of.mjs', () => ({ binOf: () => '/vitest.mjs' }));
const locked = vi.hoisted(() => []);
vi.mock('../lock/with-lock.mjs', () => ({ withHeavyLock: (job, run) => (locked.push(job.command), run({})) }));
vi.mock('../config/load.mjs', () => ({ loadStandards: () => ({ options: {} }), OWN_ROOT: '/own' }));

const longTests = Array.from({ length: 3 }, (_, index) => `/${String(index).repeat(11000)}.test.mjs`);
const ranTests = () => vi.mocked(runTimed).mock.calls.flatMap(([job]) => job.args.filter((arg) => arg.endsWith('.test.mjs')));
const quietReset = () => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
};
const exitCodes = (...codes) => codes.forEach((code) => vi.mocked(runTimed).mockResolvedValueOnce({ code, timedOut: false }));

describe('standards test runs each test file once (K5 regression)', { tags: ['critical'] }, () => {
  beforeEach(() => {
    quietReset();
    vi.mocked(changedFiles).mockReturnValue({ files: ['a.ts', 'b.ts', 'c.ts'], base: 'abc', ref: 'main' });
    vi.mocked(relatedTests).mockResolvedValue({ tests: longTests });
  });

  it('resolves the related tests first, then batches that list without repeats', async () => {
    exitCodes(0, 0);
    expect(await runTest({ rootDir: process.cwd(), args: ['pr'] })).toBe(0);
    expect(vi.mocked(relatedTests).mock.calls[0][0].files).toEqual(['a.ts', 'b.ts', 'c.ts']);
    expect(vi.mocked(runTimed).mock.calls.length).toBeGreaterThan(1);
    expect(ranTests()).toEqual(longTests);
  });

  it('exits with the first non-zero code of the batches', async () => {
    exitCodes(2, 3);
    expect(await runTest({ rootDir: process.cwd(), args: [] })).toBe(2);
    expect(vi.mocked(runTimed).mock.calls).toHaveLength(2);
  });

  it('runs nothing when no test relates to the files', async () => {
    vi.mocked(relatedTests).mockResolvedValue({ tests: [] });
    expect(await runTest({ rootDir: process.cwd(), args: [] })).toBe(0);
    expect(runTimed).not.toHaveBeenCalled();
  });

  it('fails when the related tests cannot be resolved', async () => {
    vi.mocked(relatedTests).mockResolvedValue({ failure: 'boom' });
    expect(await runTest({ rootDir: process.cwd(), args: [] })).toBe(1);
    expect(runTimed).not.toHaveBeenCalled();
  });
});

describe('standards test with file arguments (K2 public contract)', { tags: ['critical'] }, () => {
  beforeEach(() => {
    quietReset();
    vi.mocked(relatedTests).mockResolvedValue({ tests: ['/x.test.mjs'] });
    vi.mocked(runTimed).mockResolvedValue({ code: 0, timedOut: false });
  });

  it('uses the given files in place of the changed set', async () => {
    expect(await runTest({ rootDir: process.cwd(), args: ['pr', 'cli/test.mjs', 'cli/test-modes.mjs', '--reporter', 'dot'] })).toBe(0);
    expect(changedFiles).not.toHaveBeenCalled();
    expect(vi.mocked(relatedTests).mock.calls[0][0].files).toEqual(['cli/test.mjs', 'cli/test-modes.mjs']);
    const args = vi.mocked(runTimed).mock.calls[0][0].args;
    expect(args).toContain('critical||standard');
    expect(args.slice(-2)).toEqual(['--reporter', 'dot']);
  });

  it('fails on a file that does not exist, before any work', async () => {
    expect(await runTest({ rootDir: process.cwd(), args: ['cli/nope.mjs'] })).toBe(1);
    expect(relatedTests).not.toHaveBeenCalled();
    expect(runTimed).not.toHaveBeenCalled();
  });
});

describe('standards test --help (K2 public contract)', { tags: ['critical'] }, () => {
  it.each([[['--help']], [['pr', '-h']]])('prints the usage and exits 0 before any git or vitest work: %j', async (args) => {
    vi.resetAllMocks();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(await runTest({ rootDir: process.cwd(), args })).toBe(0);
    expect(log.mock.calls[0][0]).toContain('standards test');
    expect(changedFiles).not.toHaveBeenCalled();
    expect(relatedTests).not.toHaveBeenCalled();
    expect(runTimed).not.toHaveBeenCalled();
  });
});

describe('standards test lock slots (e2e takes none)', { tags: ['critical'] }, () => {
  beforeEach(() => {
    quietReset();
    locked.length = 0;
    vi.mocked(changedFiles).mockReturnValue({ files: ['a.ts'], base: 'abc', ref: 'main' });
    vi.mocked(relatedTests).mockResolvedValue({ tests: ['/x.test.mjs'] });
    vi.mocked(runTimed).mockResolvedValue({ code: 0, timedOut: false });
  });

  it('runs the e2e mode without taking a slot', async () => {
    expect(await runTest({ rootDir: process.cwd(), args: ['e2e'] })).toBe(0);
    expect(locked).toEqual([]);
    expect(runTimed).toHaveBeenCalled();
  });

  it.each(['changed', 'pr'])('runs the %s mode under a slot', async (mode) => {
    expect(await runTest({ rootDir: process.cwd(), args: [mode] })).toBe(0);
    expect(locked).toEqual([`standards test ${mode}`]);
  });
});
