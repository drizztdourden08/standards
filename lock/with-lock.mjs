/* @layer tooling-scripts @kind logic */
import { isAlive } from './is-alive.mjs';
import { acquireLock } from './acquire-lock.mjs';
import { LOCK_HOLDER_ENV, SIGNALS } from './lock.constants.mjs';

const nestedUnderHolder = (env) => {
  const holder = Number(env[LOCK_HOLDER_ENV]);
  return Number.isInteger(holder) && holder > 0 && isAlive(holder);
};

/**
 * @template T
 * @param {{ root: string, command: string, env?: NodeJS.ProcessEnv, pollMs?: number, log?: (line: string) => void }} options
 * @param {(env: NodeJS.ProcessEnv) => Promise<T>} job gets the env that marks this process as the holder
 * @returns {Promise<T>}
 */
const withHeavyLock = async (options, job) => {
  const env = options.env ?? process.env;
  if (nestedUnderHolder(env)) return job(env);
  const release = await acquireLock({ ...options, env });
  const onSignal = (signal) => {
    release();
    process.exit(128 + (signal === 'SIGINT' ? 2 : 15));
  };
  for (const signal of SIGNALS) process.once(signal, onSignal);
  process.once('exit', release);
  try {
    return await job({ ...env, [LOCK_HOLDER_ENV]: String(process.pid) });
  } finally {
    for (const signal of SIGNALS) process.removeListener(signal, onSignal);
    process.removeListener('exit', release);
    release();
  }
};

export { withHeavyLock };
