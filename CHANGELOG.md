# @drizztdourden08/standards

## 1.0.0

### Major Changes

- The rules Brock and Tessera shared move into one package above both, with the history of `brock-lint-config`. It holds the ESLint factory and rules, the stylelint token rules, the markdownlint rules, the writing gate and its word lists, the structure and prose checks from `brock-build`, tsconfig, knip and jscpd bases, the `.npmrc` and changeset templates, the reusable CI and release workflows, and the `standards lint | structure | prose | sync --check` command.
- One extension API: `structure`, `eslint`, `stylelint`, `markdownlint` and `prose` facets, loaded as core, presets, extensions declared by installed dependencies, then explicit ones from `standards.config.mjs`.
- Presets `base`, `library`, `react-app` and `design-system`. The rules of hooks move from the core into `react-app`.
- `local/file-header`: every source file opens with `/* @layer <layer> @kind <kind> */`.
- The stylelint token rules read their token sheets from the `tokens` option; no package path is built in.
- The usage-file rule ships as the opt-in extension `@drizztdourden08/standards/extensions/usage-files`.
- Rule ids stay: `local/*`, `BROCK001` to `BROCK006`, `brock/no-token-*`.

## 0.1.1

Released as `@drizztdourden08/brock-lint-config` inside Brock; see Brock's changelog.
