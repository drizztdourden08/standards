---
'@drizztdourden08/standards': minor
---

`local/no-tool-brand-words` takes the `skipStringValues` option, off unless set, and a file listed under `verbatimText: [{ files, why }]` now skips string values for it and for `local/no-em-dash`, `local/no-smart-punctuation` and `local/no-slop-prose`. Text copied word for word from an outside source can spell a banned tool or vendor name in another language, such as a word in a French dictionary entry. Comments, the header, JSX text and identifiers of a listed file are read as before by every rule, the vendor-name rule included. The rule is in `docs/structure.md`.
