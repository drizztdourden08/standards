/* @layer tooling-scripts @kind logic */
import { ageMs, legacyLockPath, lockPath, readLock, unlinkLock } from './lock-file.mjs';
import { HEARTBEAT_STALE_MS, UNREADABLE_GRACE_MS } from './lock.constants.mjs';

const beating = (file, holder) => holder.heartbeat !== true || ageMs(file) < HEARTBEAT_STALE_MS;

const holderAlive = (file, holder, alive) => alive(holder.pid) && beating(file, holder);

const isStale = (file, holder, alive) => (holder === undefined ? ageMs(file) > UNREADABLE_GRACE_MS : !holderAlive(file, holder, alive));

const dropStale = (file, seen) => {
  const again = readLock(file);
  if (again === null || again?.pid !== seen?.pid) return;
  unlinkLock(file);
};

const inspect = (file, alive) => {
  const current = readLock(file);
  if (current === null) return { free: true };
  if (!isStale(file, current, alive)) return { holder: current };
  dropStale(file, current);
  return { free: true };
};

const legacyHolder = (env, alive) => {
  const file = legacyLockPath(env);
  const current = readLock(file);
  return current && holderAlive(file, current, alive) ? { slot: 'legacy heavy-check.lock', holder: current } : undefined;
};

/**
 * @param {{ env: NodeJS.ProcessEnv, slots: number, alive: (pid: number) => boolean }} scan
 * @returns {{ free: number[], busy: { slot: string, holder?: object }[] }} free slots and live holders, legacy lock included
 */
const scanSlots = ({ env, slots, alive }) => {
  const free = [];
  const busy = [];
  for (let index = 0; index < slots; index += 1) {
    const seen = inspect(lockPath(env, index), alive);
    if (seen.free) free.push(index);
    else busy.push({ slot: `slot ${index}`, holder: seen.holder });
  }
  const legacy = legacyHolder(env, alive);
  if (legacy) busy.push(legacy);
  return { free, busy };
};

export { scanSlots };
