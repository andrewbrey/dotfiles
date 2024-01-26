#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("rustc")) {
	const installScriptPath = $.path.join(dotAppPath, "rust-install.sh");

	await $.streamDownload("https://sh.rustup.rs", installScriptPath);
	await Deno.chmod(installScriptPath, pamkit.constants.executableMask);

	await $`${installScriptPath} --no-modify-path -y`;
}

const versionOutput = await $`rustc --version`.text(); // rustc 1.66.0 (69f9c33d7 2022-12-12)
const version = versionOutput.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-manual",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
