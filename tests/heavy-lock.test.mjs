/* @layer tooling-scripts @kind test */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { acquireLock } from '../lock/acquire-lock.mjs';
import { lockPath } from '../lock/lock-file.mjs';
import { LOCK_DIR_ENV } from '../lock/lock.constants.mjs';

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const lockEnv = () => {
  const dir = mkdtempSync(join(tmpdir(), 'standards-lock-'));
  dirs.push(dir);
  return { [LOCK_DIR_ENV]: dir };
};

const holderFile = (env, pid) => {
  const file = lockPath(env);
  writeFileSync(file, `${JSON.stringify({ pid, root: '/other', command: 'standards lint', startedAt: '2026-01-01T00:00:00.000Z' })}\n`);
  return file;
};

describe('heavy check lock (K4 refusal of a second run)', { tags: ['critical'] }, () => {
  it('takes over a lock whose pid is dead, without a wait line', async () => {
    const env = lockEnv();
    const file = holderFile(env, 999999);
    const lines = [];
    const release = await acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, alive: () => false, log: (line) => lines.push(line) });
    expect(JSON.parse(readFileSync(file, 'utf8')).pid).toBe(process.pid);
    expect(lines).toEqual([]);
    release();
    expect(existsSync(file)).toBe(false);
  });

  it('waits for a live holder with one wait line and one acquire line', async () => {
    const env = lockEnv();
    holderFile(env, 999999);
    const lines = [];
    let checks = 0;
    const alive = () => ++checks < 4;
    const release = await acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, alive, log: (line) => lines.push(line) });
    release();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('waiting for the heavy check lock held by pid 999999');
    expect(lines[1]).toContain('lock acquired');
  });

  it('does not remove a lock another pid took after a release', async () => {
    const env = lockEnv();
    const release = await acquireLock({ root: '/mine', command: 'standards test', env, log: () => undefined });
    const file = holderFile(env, 999998);
    release();
    expect(JSON.parse(readFileSync(file, 'utf8')).pid).toBe(999998);
  });

  it('gives up past the wait limit with an error naming the holder', async () => {
    const env = lockEnv();
    holderFile(env, 999997);
    const job = acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, waitMs: 5, alive: () => true, log: () => undefined });
    await expect(job).rejects.toThrow(/gave up after .*pid 999997.*STANDARDS_LOCK_WAIT_S/);
  });
});
