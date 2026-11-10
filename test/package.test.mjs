import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
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
	const selection = endpoint.searchParams.get("tools").split(",");
	// The hosted endpoint adds its assistant category (load-writing-skill, load-universe-skill).
	assert.ok(selection.includes("assistant"));
	const selected = selection.filter((name) => name !== "assistant");
	registerLiteraryUniverseTools(server, {
		tools: selected,
		client: () => {
			throw new Error("Tool discovery must not access user data");
		},
	});
	const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: "package-verification", version: "1" });
	try {
		await server.connect(serverSide);
		await client.connect(clientSide);
		const { tools } = await client.listTools();
		assert.equal(tools.length, 19);
		assert.deepEqual(tools.map(({ name }) => name).sort(), selected.toSorted());
		const writeTools = [
			"create-story",
			"create-chapter",
			"save-chapter-draft",
			"create-encyclopedia-entry",
			"update-encyclopedia-entry",
			"translate-encyclopedia-entry",
		];
		const manuscriptWrites = selectTools(["stories-write", "publish"]);
		assert.ok(
			manuscriptWrites
				.filter(
					(name) => !["create-chapter", "save-chapter-draft"].includes(name),
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
		const auth = connection.extensions["com.openai"].auth;
		assert.equal(connection.type, "streamable-http");
		assert.equal(endpoint.protocol, "https:");
		assert.equal(auth.resource, `${endpoint.origin}${endpoint.pathname}`);
		assert.equal(auth.type, "oauth");
		assert.equal(auth.client.mode, "dcr");
		assert.deepEqual(auth.baseScopes.toSorted(), [
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
