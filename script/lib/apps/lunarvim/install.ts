#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("lvim")) {
	await $.requireCommand("python", "pam install -a python");
	await $.requireCommand("pip", "pam install -a python");
	await $.requireCommand("node", "pam install -a node");
	await $.requireCommand("npm", "pam install -a node");
	await $.requireCommand("cargo", "pam install -a rust");
	await $.requireCommand("rg", "pam install -a ripgrep");
	await $.requireCommand("fd", "pam install -a fd");
	await $.requireCommand("nvim", "pam install -a neovim");

	const nvimVersion =
		(await $`nvim --version`.lines()).at(0)?.split(" ")?.at(1)?.split("v")?.at(1) ?? "";

	invariant($.semver.satisfies(nvimVersion, "0.8.x"), "now you fucked up");

	const installSource =
		"https://raw.githubusercontent.com/lunarvim/lunarvim/fc6873809934917b470bff1b072171879899a36b/utils/installer/install.sh";

	const artifactPath = $.path.join(dotAppPath, "installer.sh");
	await Deno.writeTextFile(artifactPath, await $.request(installSource).text());
	await Deno.chmod(artifactPath, pamkit.constants.executableMask);

	await $`bash ${artifactPath} --yes`.env({ LV_BRANCH: "release-1.2/neovim-0.8" });
}

const meta: InstallerMeta = {
	name: $.$dirname(import.meta.url, true),
	path: $.$dirname(import.meta.url),
	type: "installed-managed",
	version: "",
	lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
