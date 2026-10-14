---
'@drizztdourden08/standards': minor
---

A test may assert the real text an app shows. In a `*.test.*` or `*.spec.*` file, a string that is the argument of a matcher called on `expect(actual)` (directly, in an array or object value, or in an asymmetric matcher such as `expect.stringContaining`) is not read by `local/no-em-dash`, `local/no-smart-punctuation` or `local/no-slop-prose`, so `expect(toast.text).toBe('File saved!')` passes. The actual value, test names, every other string in the test and the same text in source code are read as before, and `local/no-tool-brand-words` still reads the expected value. The rule is in `docs/structure.md`.
