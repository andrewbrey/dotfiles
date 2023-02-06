#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-run

// -----
// NOTE: this script should be the last to run; ensure it's
// sorted last by the file system
// -----

import { $ } from "../mod.ts";

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup($.colors.black.bgYellow(id));

const repo = "andrewbrey/dotfiles";
const envs: Record<string, string> = {
	IN_CONTAINER: `${$.env.IN_CONTAINER}`,
	IN_CLOUD_IDE: `${$.env.IN_CLOUD_IDE}`,
	GITPOD: `${$.env.GITPOD}`,
};

for (const [name, path] of Object.entries($.env.STANDARD_DIRS)) {
	envs[`SD_${name}`] = `${path}`;
}

if ($.env.IN_CLOUD_IDE || !$.env.DOTS_CLONE_IS_SSH) {
	await $`chezmoi init --apply --depth 1 ${repo}`.env(envs);
} else {
	await $`chezmoi init --apply --depth 1 --ssh ${repo}`.env(envs);
}

$.logGroupEnd();

$.logStep("done with", id);
