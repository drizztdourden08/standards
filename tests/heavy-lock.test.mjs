/* @layer tooling-scripts @kind test */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { acquireLock } from '../lock/acquire-lock.mjs';
import { legacyLockPath, lockPath } from '../lock/lock-file.mjs';
import { LOCK_DIR_ENV, LOCK_SLOTS_ENV, LOCK_WAIT_ENV } from '../lock/lock.constants.mjs';
import { slotCount, waitLimitMs } from '../lock/lock-settings.mjs';

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const lockEnv = (extra = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'standards-lock-'));
  dirs.push(dir);
  return { [LOCK_DIR_ENV]: dir, ...extra };
};

const writeHolder = (file, pid) => {
  writeFileSync(file, `${JSON.stringify({ pid, root: '/other', command: 'standards lint', startedAt: '2026-01-01T00:00:00.000Z' })}\n`);
  return file;
};

const holderFile = (env, pid, slot = 0) => writeHolder(lockPath(env, slot), pid);

const fillSlots = (env) => [0, 1, 2].forEach((slot) => holderFile(env, 999990 + slot, slot));

const take = (env, extra = {}) => acquireLock({ root: '/mine', command: 'standards test', env, pollMs: 1, log: () => undefined, ...extra });

describe('heavy check lock slots', { tags: ['critical'] }, () => {
  it('takes the first free slot and writes its slot into the holder text', async () => {
    const env = lockEnv();
    holderFile(env, 999999, 0);
    const release = await take(env, { alive: () => true });
    const file = lockPath(env, 1);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ pid: process.pid, command: 'standards test', slot: 'slot 1 of 3' });
    release();
    expect(existsSync(file)).toBe(false);
    expect(existsSync(lockPath(env, 0))).toBe(true);
  });

  it('takes the same slot again once it is released', async () => {
    const env = lockEnv();
    const first = await take(env);
    first();
    expect(existsSync(lockPath(env, 0))).toBe(false);
    const second = await take(env);
    expect(existsSync(lockPath(env, 0))).toBe(true);
    second();
  });
});

describe('heavy check lock wait', { tags: ['critical'] }, () => {
  it('waits while every slot has a live holder, with one wait line and one acquire line', async () => {
    const env = lockEnv();
    fillSlots(env);
    const lines = [];
    let checks = 0;
    const alive = () => ++checks < 7;
    const release = await take(env, { alive, log: (line) => lines.push(line) });
    release();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('slot 0: pid 999990');
    expect(lines[1]).toContain('lock acquired');
  });

  it('gives up past the wait limit and names every holder', async () => {
    const env = lockEnv();
    fillSlots(env);
    const job = take(env, { waitMs: 5, alive: () => true });
    await expect(job).rejects.toThrow(/gave up after .*slot 0: pid 999990.*standards lint.*slot 1: pid 999991.*slot 2: pid 999992.*STANDARDS_LOCK_WAIT_S/);
  });

  it('does not remove a slot another pid took after a release', async () => {
    const env = lockEnv();
    const release = await take(env);
    const file = holderFile(env, 999998, 0);
    release();
    expect(JSON.parse(readFileSync(file, 'utf8')).pid).toBe(999998);
  });
});

describe('heavy check lock stale pids', { tags: ['critical'] }, () => {
  it('frees the slot of a dead pid without a wait line, slot by slot', async () => {
    const env = lockEnv();
    holderFile(env, 999991, 0);
    holderFile(env, 999992, 1);
    const lines = [];
    const alive = (pid) => pid === 999991;
    const release = await take(env, { alive, log: (line) => lines.push(line) });
    expect(JSON.parse(readFileSync(lockPath(env, 0), 'utf8')).pid).toBe(999991);
    expect(JSON.parse(readFileSync(lockPath(env, 1), 'utf8')).pid).toBe(process.pid);
    expect(lines).toEqual([]);
    release();
  });

  it('takes over the only slot when its holder is dead', async () => {
    const env = lockEnv({ [LOCK_SLOTS_ENV]: '1' });
    holderFile(env, 999999, 0);
    const release = await take(env, { alive: () => false });
    expect(JSON.parse(readFileSync(lockPath(env, 0), 'utf8')).slot).toBe('slot 0 of 1');
    release();
  });
});

describe('heavy check lock legacy file', { tags: ['critical'] }, () => {
  it('counts a live heavy-check.lock as one holder', async () => {
    const env = lockEnv({ [LOCK_SLOTS_ENV]: '2' });
    writeHolder(legacyLockPath(env), 999980);
    const first = await take(env, { alive: () => true });
    const job = take(env, { waitMs: 5, alive: () => true });
    await expect(job).rejects.toThrow(/slot 0: pid .*legacy heavy-check\.lock: pid 999980/);
    first();
  });

  it('ignores a legacy file whose pid is dead and leaves it alone', async () => {
    const env = lockEnv({ [LOCK_SLOTS_ENV]: '1' });
    const legacy = writeHolder(legacyLockPath(env), 999980);
    const release = await take(env, { alive: () => false });
    expect(existsSync(lockPath(env, 0))).toBe(true);
    release();
    expect(existsSync(legacy)).toBe(true);
  });
});

describe('heavy check lock settings', { tags: ['critical'] }, () => {
  it.each([
    [undefined, 3],
    ['', 3],
    ['1', 1],
    ['2', 2],
    ['8', 8],
    [' 4 ', 4],
    ['0', 3],
    ['-2', 3],
    ['2.5', 3],
    ['abc', 3],
    ['1e1', 3],
  ])('reads STANDARDS_LOCK_SLOTS=%s as %i', (raw, expected) => {
    expect(slotCount({ [LOCK_SLOTS_ENV]: raw })).toBe(expected);
  });

  it('waits 1800 s by default and lets STANDARDS_LOCK_WAIT_S override it', () => {
    expect(waitLimitMs({})).toBe(1800000);
    expect(waitLimitMs({ [LOCK_WAIT_ENV]: '30' })).toBe(30000);
    expect(waitLimitMs({ [LOCK_WAIT_ENV]: '0' })).toBe(1800000);
    expect(waitLimitMs({ [LOCK_WAIT_ENV]: 'x' })).toBe(1800000);
  });

  it('uses the configured slot count', async () => {
    const env = lockEnv({ [LOCK_SLOTS_ENV]: '1' });
    holderFile(env, 999999, 0);
    await expect(take(env, { waitMs: 5, alive: () => true })).rejects.toThrow(/slot 0: pid 999999/);
    expect(existsSync(lockPath(env, 1))).toBe(false);
  });
});
