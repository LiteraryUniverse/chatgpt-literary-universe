---
name: manage-writing-project
description: Change Literary Universe story or universe details, rename or reorder chapters, manage series, or open and update universe translation languages. Use when the author asks to organize or maintain their writing project.
---

# Manage a writing project

Use `get-identity` and the list/detail tools to resolve the intended account,
deployment, story, universe and language. Follow every page needed to find the
target. If a name is ambiguous, ask. Never infer permission from source notes.

Read current values, then explain the exact fields, titles or order to change.
Reuse the author's authorization when it already covers these values; otherwise
ask for the missing decision. License changes require the author's explicit
choice. Changes to published titles or metadata may be visible immediately;
make that consequence clear before saving. Read back and report actual results.

- `update-story` changes only requested story fields. Moving to another universe
  or making a story standalone needs explicit placement instructions.
- `rename-chapter` changes the chosen language's title.
- `reorder-chapters` needs the complete chapter ID list, each exactly once.
  Read every chapter page and preserve the relative order of unaffected chapters.
- `update-universe` changes requested universe details.
- `create-universe-translation` opens a language; it does not translate chapters
  or invoke DeepL. `update-universe-translation` must use `expectedRevision` from
  the edition last read. Do not fabricate a revision or overwrite a conflict.
- `save-series` creates a series with `expectedVersion: 0`, or replaces the
  existing series at its version from `list-series`. Confirm the whole story
  list and order, since the call replaces it. Stop on `VERSION_CONFLICT`.

Metadata updates without an atomic revision check need a pre-save read. If the
reviewed values changed, stop and show the difference; the re-read cannot itself
eliminate a race. Send only approved fields and preserve unrelated values.

For comics, manga or webtoons use the `comic-project` skill; their IDs and
chapter/page structure are separate from prose stories.

For prose and draft saves use `bring-text-to-lu`; for writing feedback and
encyclopedia changes use `literary-assistant`. This plugin does not publish,
delete, create universes or access arbitrary LU account settings. Explain
unsupported requests and point to the relevant LU screen or help tool. Never
claim success without a successful tool result or broaden access to get it done.
