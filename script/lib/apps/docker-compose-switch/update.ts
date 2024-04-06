#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land,api.github.com --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));
let version = "0.0.0"; // special for compose-switch because at runtime, it's --version flag reports `docker compose` version, not the version of the compose-switch utility itself
if (await $.commandExists("compose-switch")) {
	if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
		$.logGroup(() => {
			$.logWarn(
				"warn:",
				$.dedent`
    			installation is managed; skipping manual update

    		`,
			);
		});
	} else {
		await $`sudo sh`.stdin(
			await $`curl -fL https://raw.githubusercontent.com/docker/compose-switch/master/install_on_linux.sh`
				.bytes("stdout"),
		);

		const releaseInfo = await $.ghReleaseInfo("docker", "compose-switch");
		const { tag_name } = releaseInfo;
		version = tag_name.split("v")?.at(1) ?? "";

		meta.lastCheck = Date.now();
		meta.version = version;
	}
}

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
