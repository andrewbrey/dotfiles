#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-run

// -----
// NOTE: this script should be the last to run; ensure it's
// sorted last by the file system
// -----

import { $, blackOnYellow, env, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

const repo = "andrewbrey/dotfiles";
const envs: Record<string, string> = {
  IN_CONTAINER: `${env.IN_CONTAINER}`,
  IN_CLOUD_IDE: `${env.IN_CLOUD_IDE}`,
  GITPOD: `${env.GITPOD}`,
};

for (const [name, path] of Object.entries(env.STANDARD_DIRS)) {
  envs[`SD_${name}`] = `${path}`;
}

// TODO: also check for the presence of id_ed25519?
if (env.IN_CLOUD_IDE) {
  await $`chezmoi init --apply --depth 1 ${repo}`.env(envs);
} else {
  await $`chezmoi init --apply --depth 1 --ssh ${repo}`.env(envs);
}

$.logGroupEnd();

$.logStep("done with", id);
