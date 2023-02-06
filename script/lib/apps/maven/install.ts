#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("mvn")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		await $`brew install maven`.env({ HOMEBREW_NO_ANALYTICS: "1" });
	} else {
		await $`sudo apt install -y maven`;
	}
}

const versionOutput = await $`mvn --version`.lines(); // Apache Maven 3.6.3\n......
const version = $.stripAnsi(versionOutput?.at(0) ?? "").split(" ")?.at(2) ?? "";

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version,
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
