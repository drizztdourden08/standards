/* @layer tooling-scripts @kind logic */
import { holdersText } from './holder-text.mjs';
import { isAlive } from './is-alive.mjs';
import { createLock, lockPath, removeLock } from './lock-file.mjs';
import { LOCK_WAIT_ENV, POLL_MS, REMIND_MS } from './lock.constants.mjs';
import { slotCount, waitLimitMs } from './lock-settings.mjs';
import { scanSlots } from './slot-scan.mjs';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const attempt = (job) => {
  const { env, slots, holder } = job;
  const { free, busy } = scanSlots(job);
  if (!free.length || busy.length >= slots) return { waitingOn: busy };
  const index = free[0];
  const file = lockPath(env, index);
  return createLock(file, { ...holder, slot: `slot ${index} of ${slots}` }) ? { taken: file } : { retry: true };
};

const waitStep = (wait, busy) => {
  const waited = Date.now() - wait.started;
  if (waited > wait.limitMs) throw new Error(`gave up after ${Math.round(waited / 1000)}s waiting for the heavy check lock. Holders: ${holdersText(busy)}. Set ${LOCK_WAIT_ENV} to wait longer.`);
  if (wait.lastLine && Date.now() - wait.lastLine < REMIND_MS) return;
  wait.log(`standards: waiting for the heavy check lock, all slots busy. Holders: ${holdersText(busy)}`);
  wait.lastLine = Date.now();
};

/**
 * @param {{ root: string, command: string, env?: NodeJS.ProcessEnv, pollMs?: number, waitMs?: number, alive?: (pid: number, since?: number) => boolean, log?: (line: string) => void }} job
 * @returns {Promise<() => void>} rejects once the wait passes waitMs
 */
const acquireLock = async ({ root, command, env = process.env, pollMs = POLL_MS, alive = isAlive, log = console.error, waitMs = waitLimitMs(env) }) => {
  const processStartedAt = new Date(Date.now() - process.uptime() * 1000).toISOString();
  const holder = { pid: process.pid, root, command, startedAt: new Date().toISOString(), processStartedAt };
  const scan = { env, alive, holder, slots: slotCount(env) };
  const wait = { started: Date.now(), limitMs: waitMs, lastLine: 0, log };
  let result = attempt(scan);
  while (!result.taken) {
    if (result.waitingOn) {
      waitStep(wait, result.waitingOn);
      await sleep(pollMs);
    }
    result = attempt(scan);
  }
  if (wait.lastLine) log(`standards: heavy check lock acquired after ${Math.round((Date.now() - wait.started) / 1000)}s`);
  return () => removeLock(result.taken, process.pid);
};

export { acquireLock };
