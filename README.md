# Literary Universe for ChatGPT

OpenAI directory package for the **website assistant's** writing and universe
workflows. It connects to the existing OAuth-protected MCP endpoint. It does not
run a second Claude session or consume the website's AI balance.

The `bring-text-to-lu` skill guides authors from supplied text to an unpublished
story and chapter drafts. It fetches LU's live creation choices, asks only for
unanswered required fields, confirms rights/license/AI disclosure and the chapter
plan, and then uploads the author's actual text. Explicit replacements use the
current draft version; uploads track completed chapters to resume partial work.
This is an intentional addition to the website assistant's analysis-only role.

## Supported workflows

The `literary-assistant` skill covers proofreading, tone and reading level,
continuity, developmental feedback, dialogue, world-rule analysis, and
encyclopedia discrepancies. It loads the website assistant's instructions for
each task from the hosted `load-writing-skill` and `load-universe-skill` tools
(the `assistant` category in the MCP URL), so this repository holds no copy of
them and changes on the website apply at once.

The skill loads fresh source material,
quotes evidence, distinguishes contradictions from missing explanations, and
preserves the author's voice. Reviews give analysis and small suggested
corrections. They do not authorize a save; the separate upload skill handles
explicit requests to create or replace drafts. Publishing remains separate.

Nineteen explicitly selected tools, plus the two hosted assistant tools, provide story/chapter/encyclopedia/series
reads, account identity, platform help, and encyclopedia creation, editing and
translation, plus live story-creation choices, story creation, chapter creation
and version-checked draft saves. New entries and chapters stay drafts. The chat workflow shows proposed fields,
waits for approval, re-reads before edits, and saves only approved values.
Existing-value updates and translations have overwrite annotations in the SDK.
These annotations and skill instructions guide the host; server authorization
and scope checks remain authoritative. Encyclopedia updates have no atomic
expected-version check, so the pre-save read cannot eliminate concurrent edits.

OAuth asks for `story:read`, `story:write`, `universe:read`, `universe:write` and
`universe:translate`. Tool names are explicit so category growth does not silently
broaden the listing. Chapter publication, chapter removal, entry deletion,
and encyclopedia publication tools are excluded. Resource access remains
limited by the connected account's permissions.

## Differences from the website

- Context comes from saved drafts. There is no unsaved editor selection, live
  highlighting, saved proofreading watchlist, or automatic full-story context.
- New-entry and edit previews appear in chat; they are not the website's
  persistent proposal cards. Discrepancy findings appear in chat and do not
  create website report cards.
- Universe documents, document proposals, DeepL services, image generation and
  saving images to the encyclopedia need additional scoped API/MCP support.
  ChatGPT's own image or translation features are separate from LU services.
- The existing generic entry APIs save the reviewed values; they do not provide
  the website assistant's proposal audit trail or its undo action.
- Story creation supports personal standalone stories or placement in an
  existing accessible universe. New universes, fan fiction, comics and
  organization-owned story creation remain workshop flows. Binary file import
  is not exposed; the author must supply readable text/Markdown or Tiptap JSON.

These are remaining parity gaps, not capabilities supplied by OAuth alone.

## Build and verify

```sh
npm ci
npm test
python3 package.py
```

The ZIP is `dist/literary-universe-<version>.zip`. Only the allowlisted
manifests, icon and both skills enter it, with deterministic timestamps and
permissions. The test checks the tool list and annotations against the SDK's
real MCP registration and the reviewer cases against that list.

English listing text has Czech and Japanese translations.

## Before directory submission

1. Deploy the story creation API
   ([Literary-Universe#1281](https://github.com/StorytellerCZ/Literary-Universe/pull/1281))
   and the hosted assistant tools
   ([Literary-Universe#1282](https://github.com/StorytellerCZ/Literary-Universe/pull/1282)),
   release the SDK with the creation tools
   ([sdk-typescript#6](https://github.com/LiteraryUniverse/sdk-typescript/pull/6))
   and update the hosted app's pinned SDK. Then move this repository's SDK
   dev dependency from the git commit to that release.
2. Add a custom MCP connection in ChatGPT using the exact `mcp.json` URL. Check
   all 21 tools and the five requested scopes. Test linking, refresh and
   revocation. Earlier connections must reauthorize for the new write
   scopes; existing grants must not silently gain permissions.
3. Use a dedicated reviewer account and sample story, draft, universe and entries.
   Run the five positive and three negative cases in `plugin.json`, including
   question-driven creation, upload, replacement conflicts, and cancellation
   before a save. Verify actual
   server rejection for inaccessible IDs and read-only or revoked grants.
   The cases are proposed review scenarios, not recorded ChatGPT test passes.
4. Confirm privacy disclosures, support contact and publisher identity. Record a
   walkthrough and supply `review.demo_recording_url` or enter it in the portal.
   Reviewer credentials belong only in the portal.
5. A verified publisher uploads the ZIP at <https://platform.openai.com/plugins>,
   connects **With MCP**, completes domain verification and resolves findings.
   Host the exact portal challenge only after production-write approval. Submit
   for review, then publish after OpenAI approval and owner authorization.

The server gates MCP transport with a discovery-bearing 401. Confirm ChatGPT's
linking behavior; tool-level reauthorization metadata remains a separate server
improvement if connection tests require it.

The generic Agent Plugins 1.0.0 MCP schema currently rejects the per-server
`extensions` documented by OpenAI. Validate the portable transport fields
separately and use portal validation for `extensions.com.openai.auth`. A local
SDK check does not establish store acceptance.

## Official references

- [Package format and OAuth configuration](https://developers.openai.com/plugins/build/plugins)
- [Bundled skills](https://developers.openai.com/plugins/build/skills)
- [MCP authentication](https://developers.openai.com/plugins/build/auth)
- [Submission requirements](https://developers.openai.com/plugins/deploy/submission)
- [Tool annotation rules](https://developers.openai.com/plugins/plugin-guidelines)
