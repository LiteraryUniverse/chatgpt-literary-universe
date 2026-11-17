import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { LiteraryUniverseApiError } from "@literary-universe/sdk";
import {
	registerLiteraryUniverseTools,
	selectTools,
} from "@literary-universe/sdk/mcp";

const require = createRequire(import.meta.url);
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("plugin.json", root)));
const mcp = JSON.parse(readFileSync(new URL("mcp.json", root)));
const connection = mcp.mcpServers["literary-universe"];

test("guided authoring tools save drafts without publication or deletion tools", async () => {
	const endpoint = new URL(connection.url);
	const server = new McpServer({ name: "package-verification", version: "1" });
	let api;

	const selection = endpoint.searchParams.get("tools").split(",");
	// The hosted endpoint adds its assistant category (load-writing-skill, load-universe-skill).
	assert.ok(selection.includes("assistant"));
	const selected = selection.filter((name) => name !== "assistant");
	registerLiteraryUniverseTools(server, {
		tools: selected,
		client: () => {
			if (!api) throw new Error("Tool discovery must not access user data");
			return api;
		},
	});
	const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: "package-verification", version: "1" });
	try {
		await server.connect(serverSide);
		await client.connect(clientSide);
		const { tools } = await client.listTools();
		assert.equal(tools.length, 39);
		assert.deepEqual(tools.map(({ name }) => name).sort(), selected.toSorted());
		const writeTools = [
			"create-story",
			"create-chapter",
			"save-chapter-draft",
			"create-encyclopedia-entry",
			"update-encyclopedia-entry",
			"translate-encyclopedia-entry",
			"update-story",
			"rename-chapter",
			"reorder-chapters",
			"update-universe",
			"create-universe-translation",
			"update-universe-translation",
			"save-series",
			"create-comic",
			"update-comic",
			"create-comic-chapter",
			"update-comic-chapter",
			"reorder-comic-chapters",
			"update-comic-page",
			"reorder-comic-pages",
			"create-comic-layer",
			"update-comic-layer",
		];
		const manuscriptWrites = selectTools([
			"stories-write",
			"publish",
			"comics-write",
			"universes-write",
			"images",
		]);
		assert.ok(
			manuscriptWrites
				.filter((name) =>
					[
						"remove-chapter",
						"set-story-visibility",
						"publish-chapter",
						"publish-comic-chapter",
						"remove-comic-chapter",
						"remove-comic-page",
						"remove-comic-layer",
						"delete-encyclopedia-entry",
						"set-encyclopedia-entry-publication",
						"upload-comic-pages",
						"replace-comic-page-image",
						"set-cover",
					].includes(name),
				)
				.every((name) => !selected.includes(name)),
		);
		for (const tool of tools) {
			assert.equal(
				tool.annotations.readOnlyHint,
				!writeTools.includes(tool.name),
				tool.name,
			);
			assert.equal(
				tool.annotations.destructiveHint,
				[
					"save-chapter-draft",
					"update-encyclopedia-entry",
					"translate-encyclopedia-entry",
				].includes(tool.name),
				tool.name,
			);
			assert.equal(
				tool.annotations.openWorldHint,
				["search-lu-docs", "fetch-lu-docs"].includes(tool.name),
				tool.name,
			);
		}
		const calls = [];
		api = {
			renameChapter: async (args) => {
				calls.push(["rename", args]);
				return { id: args.id, title: args.title };
			},
			reorderChapters: async (args) => {
				calls.push(["reorder", args]);
				return { storyId: args.storyId };
			},
			saveSeries: async (args) => {
				calls.push(["series", args]);
				return { version: args.expectedVersion + 1 };
			},
			createComic: async (args) => {
				calls.push(["create-comic", args]);
				return { id: "comic-1" };
			},
			createComicLayer: async (args) => {
				calls.push(["create-layer", args]);
				return { id: "layer-1", ...args };
			},
			updateComicLayer: async (args) => {
				calls.push(["update-layer", args]);
				return args;
			},
			comicPages: async () => [
				{ id: "secure-page", storageMode: "secure", layers: [] },
			],
			comics: async () => {
				throw new LiteraryUniverseApiError(
					"FORBIDDEN",
					"comic:read is required",
				);
			},
		};
		for (const [name, args] of [
			["rename-chapter", { id: "c2", language: "en", title: "The Crossing" }],
			["reorder-chapters", { storyId: "s1", chapterIds: ["c2", "c1"] }],
			[
				"save-series",
				{
					universeId: "u1",
					seriesId: "series1",
					expectedVersion: 7,
					title: "Journey",
					storyIds: ["s1"],
				},
			],
		]) {
			const result = await client.callTool({ name, arguments: args });
			assert.ok(!result.isError, JSON.stringify(result));
			assert.deepEqual(calls.at(-1)[1], args);
		}
		const before = calls.length;
		const invalid = await client.callTool({
			name: "save-series",
			arguments: { universeId: "u1", title: "Journey", storyIds: ["s1"] },
		});
		assert.equal(invalid.isError, true);
		assert.equal(
			calls.length,
			before,
			"missing version must not reach the API",
		);
		for (const [name, args] of [
			[
				"create-comic",
				{
					title: "Mira",
					description: "A journey",
					format: "manga",
					license: "cc-by",
					language: "ja",
					isAIGenerated: false,
				},
			],
			[
				"create-comic-layer",
				{
					pageId: "page-1",
					kind: "text",
					language: "ja",
					items: [
						{
							id: "bubble-1",
							x: 0.1,
							y: 0.1,
							w: 0.2,
							h: 0.1,
							text: "Hello",
							writingMode: "vertical-rl",
						},
					],
				},
			],
			[
				"update-comic-layer",
				{
					id: "layer-1",
					items: [
						{ id: "bubble-1", x: 0.1, y: 0.1, w: 0.2, h: 0.1, text: "Changed" },
						{ id: "bubble-2", x: 0.5, y: 0.1, w: 0.2, h: 0.1, text: "Keep me" },
					],
				},
			],
		]) {
			const result = await client.callTool({ name, arguments: args });
			assert.ok(!result.isError, JSON.stringify(result));
			assert.deepEqual(
				calls.at(-1)[1],
				args,
				"Comic fields and existing layer item IDs must survive dispatch",
			);
		}
		const beforeInvalidLayer = calls.length;
		const invalidLayer = await client.callTool({
			name: "create-comic-layer",
			arguments: {
				pageId: "page-1",
				kind: "text",
				language: "ja",
				items: [{ x: 2, y: 0, w: 0.2, h: 0.2, text: "Off page" }],
			},
		});
		assert.equal(invalidLayer.isError, true);
		assert.equal(
			calls.length,
			beforeInvalidLayer,
			"Out-of-range coordinates must not reach the API",
		);
		const pages = await client.callTool({
			name: "list-comic-pages",
			arguments: { chapterId: "chapter-1" },
		});
		assert.deepEqual(pages.structuredContent, {
			pages: [{ id: "secure-page", storageMode: "secure", layers: [] }],
		});
		const denied = await client.callTool({
			name: "list-comics",
			arguments: {},
		});
		assert.equal(denied.isError, true);
		assert.match(denied.content[0].text, /FORBIDDEN.*comic:read/);
		const auth = connection.extensions["com.openai"].auth;
		assert.equal(connection.type, "streamable-http");
		assert.equal(endpoint.protocol, "https:");
		assert.equal(auth.resource, `${endpoint.origin}${endpoint.pathname}`);
		assert.equal(auth.type, "oauth");
		assert.equal(auth.client.mode, "dcr");
		assert.deepEqual(auth.baseScopes.toSorted(), [
			"comic:read",
			"comic:write",
			"story:read",
			"story:write",
			"universe:read",
			"universe:translate",
			"universe:write",
		]);
		assert.deepEqual(auth.defaultScopes, []);
		const review = manifest.extensions["com.openai"].review.test_cases;
		for (const scenario of review.positive) {
			for (const name of scenario.tools_triggered.split(", ")) {
				assert.ok(
					selected.includes(name),
					`Reviewer tool unavailable: ${name}`,
				);
			}
		}
	} finally {
		await client.close();
		await server.close();
	}
});

test("the distribution includes every skill, its onboarding entry and no developer files", () => {
	const first = execFileSync("python3", ["package.py"], {
		cwd: root,
		encoding: "utf8",
	}).trim();
	const bytes = readFileSync(first);
	execFileSync("python3", ["package.py"], { cwd: root });
	assert.deepEqual(readFileSync(first), bytes, "ZIP must be reproducible");
	const entries = JSON.parse(
		execFileSync(
			"python3",
			[
				"-c",
				"import json,sys,zipfile; print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))",
				first,
			],
			{ encoding: "utf8" },
		),
	);
	const onboarding = manifest.extensions["com.openai"].onboardingSkill;
	assert.equal(onboarding, "./skills/setup-writing-project/SKILL.md");
	assert.deepEqual(entries, [
		"assets/icon.png",
		"mcp.json",
		"plugin.json",
		"skills/bring-text-to-lu/SKILL.md",
		"skills/comic-project/SKILL.md",
		"skills/literary-assistant/SKILL.md",
		"skills/manage-writing-project/SKILL.md",
		"skills/setup-writing-project/SKILL.md",
	]);
	assert.ok(entries.includes(onboarding.slice(2)));
	for (const name of entries.filter((name) => name.endsWith("SKILL.md"))) {
		const skill = readFileSync(new URL(name, root), "utf8");
		assert.match(skill, /^---\nname: [a-z-]+\ndescription: /);
		for (const [, target] of skill.matchAll(/use the `([a-z-]+)`\s+skill/g)) {
			assert.ok(
				entries.includes(`skills/${target}/SKILL.md`),
				`Missing referenced skill ${target}`,
			);
		}
	}
});
