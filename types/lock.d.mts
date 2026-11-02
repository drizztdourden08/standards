/* @layer tooling-scripts @kind types */
export interface LockHolder {
  pid: number;
  root: string;
  command: string;
  startedAt: string;
  processStartedAt?: string;
}

export interface LockJob {
  root: string;
  command: string;
  env?: NodeJS.ProcessEnv;
  pollMs?: number;
  waitMs?: number;
  log?: (line: string) => void;
}

/** takes the machine-wide heavy check lock, taking the first free slot of STANDARDS_LOCK_SLOTS (3 by default) and waiting its turn up to waitMs (STANDARDS_LOCK_WAIT_S, 1800 s by default); the returned function releases it */
export function acquireLock(job: LockJob & { alive?: (pid: number, since?: number) => boolean }): Promise<() => void>;

/** runs the job under the lock; the job gets the env that marks this process as the holder */
export function withHeavyLock<T>(options: LockJob, job: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T>;

/** runs a command under the lock, with a timeout; resolves to its exit code */
export function runLocked(ctx: { rootDir: string; args: string[]; timeoutMs?: number }): Promise<number>;

/** true when the pid is a live process; with since (epoch ms), also when it began by then, so a later process that reused the pid counts as dead */
export function isAlive(pid: number, since?: number): boolean;

/** the file of one slot, heavy-check.<slot>.lock */
export function lockPath(env?: NodeJS.ProcessEnv, slot?: number): string;

/** the single heavy-check.lock of an older standards version */
export function legacyLockPath(env?: NodeJS.ProcessEnv): string;

/** the slot count: STANDARDS_LOCK_SLOTS when an integer of 1 or more, else 3 */
export function slotCount(env?: NodeJS.ProcessEnv): number;

/** the wait limit in ms: STANDARDS_LOCK_WAIT_S when positive, else 1800 s */
export function waitLimitMs(env?: NodeJS.ProcessEnv): number;

export const LOCK_HOLDER_ENV: 'STANDARDS_LOCK_HOLDER';
export const LOCK_DIR_ENV: 'STANDARDS_LOCK_DIR';
export const LOCK_SLOTS_ENV: 'STANDARDS_LOCK_SLOTS';
export const LOCK_WAIT_ENV: 'STANDARDS_LOCK_WAIT_S';
export const LOCK_FILE_NAME: 'heavy-check.lock';
