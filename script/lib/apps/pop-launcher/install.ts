#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, getChezmoiData, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const installRootPath = $.path.join("usr", "lib", "pop-launcher", "scripts");
const dirLinkInstallPath = $.path.join(installRootPath, env.USER);

const installed = await $.exists(dirLinkInstallPath);
if (!installed) {
  const chezmoiData = await getChezmoiData();

  const dirLinkSrcPath = $.path.join(chezmoiData.standard_dirs.dot_dots_apps, "pop-launcher");

  // @see https://www.arm64.ca/post/creating-launch-plugins-for-pop-os-updated/
  if (chezmoiData.is_popos) {
    await $`sudo mkdir -p ${installRootPath}`;
    await $`sudo ln -sf ${dirLinkSrcPath}/ ${dirLinkInstallPath}`;
  }
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "uninstalled" : "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
