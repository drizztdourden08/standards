/* @layer tooling-scripts @kind types */
export interface LockHolder {
  pid: number;
  root: string;
  command: string;
  startedAt: string;
}

export interface LockJob {
  root: string;
  command: string;
  env?: NodeJS.ProcessEnv;
  pollMs?: number;
  waitMs?: number;
  log?: (line: string) => void;
}

/** takes the machine-wide heavy check lock, waiting its turn up to waitMs (STANDARDS_LOCK_WAIT_S, 300 s by default); the returned function releases it */
export function acquireLock(job: LockJob & { alive?: (pid: number) => boolean }): Promise<() => void>;

/** runs the job under the lock; the job gets the env that marks this process as the holder */
export function withHeavyLock<T>(options: LockJob, job: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T>;

/** runs a command under the lock, with a timeout; resolves to its exit code */
export function runLocked(ctx: { rootDir: string; args: string[]; timeoutMs?: number }): Promise<number>;

export function isAlive(pid: number): boolean;

export function lockPath(env?: NodeJS.ProcessEnv): string;

export const LOCK_HOLDER_ENV: 'STANDARDS_LOCK_HOLDER';
export const LOCK_DIR_ENV: 'STANDARDS_LOCK_DIR';
export const LOCK_FILE_NAME: 'heavy-check.lock';
