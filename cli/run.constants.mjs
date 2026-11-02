/* @layer tooling-scripts @kind constants */
const MINUTE = 60 * 1000;

const LINT_TIMEOUTS_MS = { typecheck: 5 * MINUTE, eslint: 10 * MINUTE, stylelint: 3 * MINUTE, prose: 2 * MINUTE, knip: 5 * MINUTE, jscpd: 5 * MINUTE };
const TEST_TIMEOUTS_MS = { changed: 10 * MINUTE, pr: 20 * MINUTE, e2e: 30 * MINUTE };
const TEST_MODES = ['changed', 'pr', 'e2e'];

const TEST_USAGE = `standards test [changed|pr|e2e] [files] [--base <ref>] [--root <dir>] [vitest args]

  Runs the tests related to the files changed against the base branch, filtered by tag:
  changed = critical, pr = critical and standard, e2e = e2e. Each test file runs once.
  Files given on the command line replace the changed set. Put them before the vitest args.
  changed and pr take a heavy check slot, e2e takes none. Hard timeout.

Options:
  --base <ref>         compare with this ref instead of the default branch
  --root <dir>         repo root (default: the current directory)
  -h, --help`;

const BASE_ENV ='STANDARDS_BASE';
const BASE_REFS = ['main', 'master', 'origin/main', 'origin/master'];
const MAX_CHANGED_FILES = 400;
const WHOLE_TREE_FILES = /(^|\/)(?:eslint\.config\.[cm]?[jt]s|stylelint\.config\.[cm]?[jt]s|\.stylelintrc[^/]*|tsconfig[^/]*\.json|standards\.config\.[cm]?[jt]s|package\.json|pnpm-lock\.yaml|\.jscpd\.json|knip\.json)$/;
const MAX_BATCH_FILES = 1000;
const MAX_BATCH_CHARS = 24000;
const TEST_BATCH_CHARS = 24000;
const HEAP_DEFAULT_MB = 4096;
const HEAP_ENV = 'STANDARDS_LINT_HEAP_MB';
const ESLINT_FILES = /\.(?:[cm]?[jt]sx?)$/;
const JSCPD_FILES = /\.(?:[cm]?[jt]sx?|css)$/;

export { LINT_TIMEOUTS_MS, TEST_TIMEOUTS_MS, TEST_MODES, TEST_USAGE, BASE_ENV, BASE_REFS, MAX_CHANGED_FILES, WHOLE_TREE_FILES, ESLINT_FILES, JSCPD_FILES, MAX_BATCH_FILES, MAX_BATCH_CHARS, TEST_BATCH_CHARS, HEAP_DEFAULT_MB, HEAP_ENV };
