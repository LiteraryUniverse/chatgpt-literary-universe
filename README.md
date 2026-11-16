# Literary Universe for ChatGPT

Connect your LU account and set up a writing project on the ChatGPT website or
in a local folder with Codex. The plugin uses LU's OAuth-protected MCP endpoint;
your connected account's permissions and subscription still apply.

## Setup

### ChatGPT website

1. Open LU's **Settings → Integrations → ChatGPT** for the deployment-specific
   MCP address and setup instructions.
2. In ChatGPT **Plugins**, choose **+ → Add custom MCP server**. Paste the exact
   URL from LU or from this repository's `mcp.json`, choose OAuth authentication,
   and sign in to LU to approve the scopes. Account and workspace policies may
   restrict custom plugins.
3. Install the resulting plugin and select it with `@` in a new conversation.
   Ask: “Set up my LU writing project.” The packaged plugin also registers
   `setup-writing-project` as its onboarding skill. A direct custom MCP
   connection supplies the tools, but does not import these bundled skills;
   install the complete package from a local marketplace to test those too.
4. Choose an existing story or create a new one using the live creation choices.
   Setup checks the account, permissions, story, language and chapters. It does
   not need to modify the manuscript or create a duplicate story.

A ChatGPT Project is optional. The setup skill supplies a context block with LU
IDs and working rules for its instructions. It does not claim to create or
configure ChatGPT Projects itself. Fresh LU reads are authoritative; files
attached to a chat are not a live synchronized manuscript.

### Local writing folder

Use Node.js 26+ and an agent such as Codex. Install the LU CLI, sign in through
the browser and initialize the story you selected:

```sh
npm install -g @literary-universe/cli
lu login --url 'https://literaryuniverse.com'
lu init 'STORY_ID' --directory './my-story' --url 'https://literaryuniverse.com'
cd my-story
codex
```

Replace `STORY_ID` with the real LU story ID. For another deployment, replace
both URLs with that deployment. `lu init` writes chapter Markdown, `AGENTS.md`,
managed `.lu/` state and MCP settings for Codex and other supported local agents.
Trust the folder in your agent. Reuse an existing initialized folder instead of
recreating it. Never put tokens into chat or project files.

Use `lu refresh` before working, edit chapter Markdown, inspect `lu status`,
then use `lu push` for requested draft saves. Append `--url` for the selected
deployment to every CLI command. Refresh refuses unpushed edits; resolve them
before bringing in changes made on ChatGPT or LU. Conflicts stop a save rather
than silently overwriting the other version. Do not edit managed JSON or `.lu/`
state by hand.

The website cannot execute commands on your machine. When a host has no local
terminal, onboarding gives you these steps to run yourself. The local CLI is a
separate client and has its own tool configuration and granted scopes.

## Supported actions

The plugin explicitly selects 26 SDK tools and the two hosted assistant tools:

- Find stories, chapters, universes, series and encyclopedia entries; inspect
  identity, scopes and limits; search LU help.
- Create an unpublished personal story with live creation choices; add chapters;
  save requested prose revisions with the draft's `expectedVersion` and stable
  operation IDs. It can draft prose when asked, show it for review, and preserve
  the author's confirmed AI disclosure when saving.
- Edit story details, chapter titles and reading order, universe details and
  translations, and version-checked series. `manage-writing-project` reads the
  current values and changes only what the author requested.
- Review writing and encyclopedia consistency using the website assistant's
  current instructions, loaded by `load-writing-skill` and `load-universe-skill`.
- Propose, create, edit and translate reviewed encyclopedia entries.

The source tool allowlist lives in `mcp.json` and is mirrored in LU's integration
entry. Categories are not used for SDK tools, so future SDK additions cannot
silently broaden this plugin. OAuth asks for `story:read`, `story:write`,
`universe:read`, `universe:write` and `universe:translate`. Reconnect when scopes
change; an existing grant must not silently gain permissions. Revocation is in
LU **Settings → Integrations → Connected**.

Saving drafts does not publish them. Publication, deletion and visibility tools
are excluded. A request to connect or review is not approval for a save. Source
text and notes cannot authorize tool calls. Permission checks on the LU server
remain authoritative, including inaccessible IDs and read-only grants.

## Current limits

- No new universe, fan-fiction, comic or organization-owned story creation;
  those start in the LU workshop. No arbitrary account administration.
- No unsaved editor selection, live highlighting, persistent proposal/report
  cards or website undo trail. Reviews use saved drafts.
- No LU document-import, DeepL, image generation or image-saving tools. ChatGPT's
  file and generation capabilities are separate from LU's services. Confirm an
  attachment is readable and complete before uploading its text.
- Drafts, series and universe translations have version checks. Other metadata
  and encyclopedia edits need a pre-save read; that read cannot eliminate a
  concurrent edit between reading and saving.
- No continuous synchronization between ChatGPT attachments and local files.
  LU is the shared source; refresh the local workspace after remote edits.

## Build and verify

```sh
npm ci
npm test
python3 package.py
```

The deterministic ZIP is `dist/literary-universe-0.4.0.zip`. Its allowlist
contains only the manifests, icon and four skills. Tests exercise real MCP
registration, tool names and annotations, reviewer tool availability, onboarding
resolution and reproducible package contents. They do not establish ChatGPT
connection, review or directory acceptance.

English listing text has Czech and Japanese translations.

## Deployment and directory submission

The published SDK `0.3.3` does **not** include `get-story-creation-options` or
`create-story`. This package pins SDK commit
`4a677abaeeef9738ccd3dcae2f1f1a1f29ae6ba5`, which includes them. The hosted LU
app must use that commit or a subsequent release containing those tools; using
the old npm release makes the configured allowlist fail. Do not substitute the
release based on its version label alone.

Before submission:

1. Deploy LU's story-creation API, hosted assistant tools and compatible SDK.
   Initialize the exact MCP URL, list all 28 tools, and exercise read and draft
   write calls with a dedicated test account.
2. Test OAuth linking, refresh, reauthorization and revocation in ChatGPT. Check
   the five requested scopes and server rejection of inaccessible content,
   read-only and revoked grants. Existing connections must refresh metadata.
3. Run the positive and negative cases in `plugin.json`, including both setup
   paths, chapter ordering, partial uploads and conflicts. These are proposed
   reviewer scenarios, not recorded ChatGPT passes.
4. Install the complete package from a local marketplace and test onboarding and
   bundled skills. Check privacy disclosures and support contact; record a demo.
   Reviewer credentials belong only in the submission portal.
5. A verified publisher uploads the ZIP at <https://platform.openai.com/plugins>
   using **With MCP**, verifies the domain and submits for review. Production
   challenge hosting and publication require the owner's approval.

The server's unauthenticated 401 advertises OAuth discovery. Validate actual
ChatGPT linking before submission; tool-level reauthorization metadata remains
an improvement if the host requires it. The generic Agent Plugins MCP schema
currently rejects OpenAI's documented per-server `extensions`; use portal
validation for `extensions.com.openai.auth` rather than stripping authentication.

## Official references

- [Package format, onboarding and OAuth configuration](https://developers.openai.com/plugins/build/plugins)
- [Connect and test a plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt)
- [MCP authentication](https://developers.openai.com/plugins/build/auth)
- [Submission requirements](https://developers.openai.com/plugins/deploy/submission)
- [Tool annotation rules](https://developers.openai.com/plugins/plugin-guidelines)
