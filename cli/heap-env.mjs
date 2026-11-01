/* @layer tooling-scripts @kind logic */
import { HEAP_DEFAULT_MB, HEAP_ENV } from './run.constants.mjs';

/**
 * @param {NodeJS.ProcessEnv} env STANDARDS_LINT_HEAP_MB sets the ceiling in MB
 * @returns {NodeJS.ProcessEnv} env with a V8 old space ceiling added to NODE_OPTIONS
 */
const withHeapCeiling = (env) => {
  const asked = Number(env[HEAP_ENV]);
  const megabytes = Number.isInteger(asked) && asked > 0 ? asked : HEAP_DEFAULT_MB;
  return { ...env, NODE_OPTIONS: [env.NODE_OPTIONS, `--max-old-space-size=${megabytes}`].filter(Boolean).join(' ') };
};

export { withHeapCeiling };
