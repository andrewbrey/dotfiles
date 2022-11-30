#!/usr/bin/env -S deno run --allow-env --allow-net=deb.nodesource.com,deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta, streamDownload } from "../_cli/pamkit.ts";

osInvariant();
invariant(typeof (await $.which("node")) !== "undefined", "node is required");
invariant(typeof (await $.which("npm")) !== "undefined", "npm is required");

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const npmGlobals = [
  "@antfu/ni",
  "@bitwarden/cli",
  "add-gitignore",
  "commitizen",
  "cz-conventional-changelog",
  "file-path-bookmarks",
  "http-server",
  "np",
  "npkill",
  "npm-check-updates",
  "pnpm",
  "prettier",
  "rimraf",
  "yarn@1",
];

await $`npm i -g ${npmGlobals}`;

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
