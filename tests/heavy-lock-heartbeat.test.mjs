/* @layer tooling-scripts @kind test */
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { acquireLock } from '../lock/acquire-lock.mjs';
import { lockPath } from '../lock/lock-file.mjs';
import { LOCK_DIR_ENV, LOCK_SLOTS_ENV } from '../lock/lock.constants.mjs';

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const lockEnv = () => {
  const dir = mkdtempSync(join(tmpdir(), 'standards-lock-'));
  dirs.push(dir);
  return { [LOCK_DIR_ENV]: dir, [LOCK_SLOTS_ENV]: '1' };
};

const writeHolder = (env, { heartbeat, ageMs }) => {
  const holder = { pid: process.pid, root: '/other', command: 'standards lint', startedAt: new Date().toISOString(), ...(heartbeat ? { heartbeat } : {}) };
  const file = lockPath(env, 0);
  writeFileSync(file, `${JSON.stringify(holder)}\n`);
  const touched = new Date(Date.now() - ageMs);
  utimesSync(file, touched, touched);
};

const tryAcquire = (env) => acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, waitMs: 30, log: () => undefined });

describe('heavy check lock heartbeat', { tags: ['critical'] }, () => {
  it('takes over a heartbeat lock whose pid exists but whose file is 2 minutes old', async () => {
    const env = lockEnv();
    writeHolder(env, { heartbeat: true, ageMs: 120000 });
    const release = await tryAcquire(env);
    release();
  });

  it('waits on a heartbeat lock whose pid exists and whose file is fresh', async () => {
    const env = lockEnv();
    writeHolder(env, { heartbeat: true, ageMs: 5000 });
    await expect(tryAcquire(env)).rejects.toThrow(/gave up/);
  });

  it('keeps a lock without a heartbeat alive while its pid exists, however old the file', async () => {
    const env = lockEnv();
    writeHolder(env, { heartbeat: false, ageMs: 600000 });
    await expect(tryAcquire(env)).rejects.toThrow(/gave up/);
  });
});
