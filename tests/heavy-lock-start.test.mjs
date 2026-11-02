/* @layer tooling-scripts @kind test */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAlive } from '../lock/is-alive.mjs';
import { acquireLock } from '../lock/acquire-lock.mjs';
import { lockPath } from '../lock/lock-file.mjs';
import { LOCK_DIR_ENV, LOCK_SLOTS_ENV } from '../lock/lock.constants.mjs';
import { processStart } from '../lock/process-start.mjs';

vi.mock('../lock/process-start.mjs', () => ({ processStart: vi.fn() }));

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  vi.mocked(processStart).mockReset();
});

const LOCKED_AT = Date.parse('2026-11-02T05:02:29Z');

const lockEnv = () => {
  const dir = mkdtempSync(join(tmpdir(), 'standards-lock-'));
  dirs.push(dir);
  return { [LOCK_DIR_ENV]: dir, [LOCK_SLOTS_ENV]: '1' };
};

const writeHolder = (env, extra = {}) => {
  const holder = { pid: process.pid, root: '/other', command: 'standards lint', startedAt: new Date(LOCKED_AT).toISOString(), ...extra };
  writeFileSync(lockPath(env, 0), `${JSON.stringify(holder)}\n`);
};

describe('heavy check lock pid reuse', { tags: ['critical'] }, () => {
  it('counts a pid that exists but started after the lock as dead', () => {
    vi.mocked(processStart).mockReturnValue(Date.parse('2026-11-02T05:05:04Z'));
    expect(isAlive(process.pid, LOCKED_AT)).toBe(false);
  });

  it('counts a pid that started before the lock, or within the tolerance, as alive', () => {
    vi.mocked(processStart).mockReturnValue(LOCKED_AT - 60000);
    expect(isAlive(process.pid, LOCKED_AT)).toBe(true);
    vi.mocked(processStart).mockReturnValue(LOCKED_AT + 1500);
    expect(isAlive(process.pid, LOCKED_AT)).toBe(true);
  });

  it('keeps a pid that exists alive when its start time cannot be read', () => {
    vi.mocked(processStart).mockReturnValue(undefined);
    expect(isAlive(process.pid, LOCKED_AT)).toBe(true);
    expect(isAlive(process.pid)).toBe(true);
  });

  it('takes over the slot of a lock whose pid was reused by a later process', async () => {
    vi.mocked(processStart).mockReturnValue(LOCKED_AT + 150000);
    const env = lockEnv();
    writeHolder(env);
    const lines = [];
    const release = await acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, waitMs: 50, log: (line) => lines.push(line) });
    expect(lines).toEqual([]);
    release();
  });

  it('judges a lock by the process start it recorded, ahead of the lock time', async () => {
    vi.mocked(processStart).mockReturnValue(LOCKED_AT - 30000);
    const env = lockEnv();
    writeHolder(env, { processStartedAt: new Date(LOCKED_AT - 600000).toISOString() });
    const release = await acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, waitMs: 20, log: () => undefined });
    release();
  });

  it('waits on a lock whose recorded process start matches the live process', async () => {
    vi.mocked(processStart).mockReturnValue(LOCKED_AT - 600000);
    const env = lockEnv();
    writeHolder(env, { processStartedAt: new Date(LOCKED_AT - 600000).toISOString() });
    const job = acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, waitMs: 20, log: () => undefined });
    await expect(job).rejects.toThrow(/gave up/);
  });
});
