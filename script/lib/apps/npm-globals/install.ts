#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("node", "pam install -a node");
await $.requireCommand("npm", "pam install -a node");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const chezmoiData = await $.getChezmoiData();

const npmGlobals = new Set([
	"@antfu/ni",
	"add-gitignore",
	"commitizen",
	"cz-conventional-changelog",
	"http-server",
	"neovim",
	"np",
	"npkill",
	"npm-check-updates",
	"pnpm",
	"prettier",
	"rimraf",
	"tree-sitter-cli",
]);

if (!chezmoiData.is_personal_machine) {
	// NOTE: Add items here for non-personal machines
	[].forEach((n) => npmGlobals.add(n));
}

await $`npm i -g ${Array.from(npmGlobals)}`;

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version: "",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
