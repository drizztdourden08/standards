<!-- @layer docs @kind doc -->
# Test standard

The full standard, with the KEEP and WIPE rules, lives in `docs/test-standard.md` of the shared config repo. This page keeps the tables a repo needs while it works.

## Three tags, one per test

| Tag | Runs | Rules |
|---|---|---|
| `critical` | `pnpm test`, only the tests related to changed files | Under 1 s, no child process, no network, no real build, no real files outside a temp folder, no timers or sleeps. Timeout 5 s. |
| `standard` | `pnpm test:pr`, critical and standard | Same rules. Timeout 30 s. |
| `e2e` | `pnpm test:e2e`, for a release or a special occasion | Real app, real tools, real build. Timeout 120 s, one at a time, own process cleanup. |

The lint rule `local/test-has-one-tag` fails a test with no tag, two tags or an unknown tag. It reads vitest's form, `{ tags: ['critical'] }`, and Playwright's form, `{ tag: '@critical' }` or `{ tag: ['@e2e'] }`, on `test(...)` and `test.describe(...)`. A tag also counts on a describe wrapper named `describe` plus a capital, such as `describeDataset(...)`, and on a conditional suite, `(ready ? describe : describe.skip)(...)`. An annotation call whose last argument is a reason string, such as `test.skip(!ready, 'reason')`, is not a test. One test that mixes the two forms has two tags. The rule covers `*.test.*`, `*.spec.*`, `*.e2e.*` and `*.e2e.test.*` files and every file under a `tests` or `e2e` folder.

## Commands

| Script | Runs |
|---|---|
| `pnpm test` | `standards test`: critical, related to the files changed against the base |
| `pnpm test:pr` | `standards test pr`: critical and standard, related to the changes |
| `pnpm test:e2e` | `standards test e2e`: e2e, related to the changes |

No mode runs the whole project. Files given on the command line (`pnpm test src/a.ts`, before any vitest option) replace the changed set, and the tags of the mode still filter. A test file related to many changed files runs once. `--base <ref>` moves the base, so a release passes the last release tag. `templates/package-scripts.json` holds the script block.

## A test is written only for one of these

- critical: K1 business logic, K2 public contract, K3 data safety, K4 security and refusal, K5 regression.
- standard: S1 component behavior, S2 integration of two or three modules with fakes, S3 edge and failure paths, S4 package boundary.
- e2e: E1 one smoke per user journey, E2 real tools, E3 parity and benchmarks.

Name the KEEP rule in the test title or header. A test that fits none of them is deleted.
