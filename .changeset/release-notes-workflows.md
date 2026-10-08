---
'@drizztdourden08/standards': minor
---

The reusable workflows carry the release note standard. `release.yml` runs `release-notes version` in place of the version command, so the version pull request holds a draft `release-notes/v<version>.md` written from the changelogs; after the merge it refuses to publish while that note is a draft or malformed, then creates the GitHub release `v<version>` from it in place of one changeset release per package. `ci.yml` runs `release-notes check`. Both take a `release-notes` input naming the command (`pnpm exec standards release-notes` by default), and an install without the command keeps the old behaviour with a notice.
