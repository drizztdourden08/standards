<!-- @layer docs @kind doc -->
# brock-lint-config

The lint stack every Brock repo runs: the local ESLint rules and the writing gate, stylelint token rules, markdownlint rules, and the tsconfig bases.

## Use

```js
// eslint.config.mjs
import { brockEslint } from '@drizztdourden08/brock-lint-config';
export default brockEslint({ primitivesGlobs: ['src/ui/primitives/**/*.tsx'], allow: ['enhanced'] });

// stylelint.config.mjs
import { brockStylelint } from '@drizztdourden08/brock-lint-config/stylelint';
export default brockStylelint({ uiGlobs: ['src/**/*.css'], tokenGlobs: ['src/theme/**/*.css'] });

// .markdownlint-cli2.mjs
import { brockMarkdownlint } from '@drizztdourden08/brock-lint-config/markdownlint';
export default brockMarkdownlint({ ignores: ['vendor/**'] });
```

```json
// tsconfig.json
{ "extends": "@drizztdourden08/brock-lint-config/tsconfig/react.json", "include": ["src"] }
```

## Rules

| Rule | Blocks |
|---|---|
| `local/no-raw-html` (warn) | a lowercase JSX tag outside `primitivesGlobs` |
| `local/no-raw-color` | a hex, rgb() or hsl() literal in an inline style object |
| `local/no-as-element-with-primitive` | `as="button"` and friends when a primitive exists |
| `local/no-static-inline-style` | a fully static `style={{...}}` object |
| `local/no-em-dash` / `BROCK001` | em dash, en dash |
| `local/no-smart-punctuation` / `BROCK002` | unicode ellipsis, curly quotes |
| `local/no-slop-prose` / `BROCK003` | stock phrases, connectors, slop words, filler adverbs, `ensure` as a verb |
| `func-style` | `function` declarations; arrow functions only |
| `no-restricted-syntax` | inline `export`; raw `input`, `select`, `textarea` outside primitives |

None of the writing rules has an auto-fix. Rewrite the sentence.

A domain word the gate should skip goes in the factory's `allow`. A lowercase entry matches any casing; an entry with a capital matches only that casing.
