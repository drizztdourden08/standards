---
"@drizztdourden08/standards": patch
---

`local/test-has-one-tag` reads the tag on a describe wrapper whose name starts with `describe` and a capital, such as `describeDataset(...)`, and on a conditional suite, `(ready ? describe : describe.skip)(...)`. It skips every annotation call whose last argument is a reason string, such as `test.skip(!ready, 'needs the dataset')`.
