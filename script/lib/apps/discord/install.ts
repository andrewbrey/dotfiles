#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("discord")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask discord`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const debInstallerPath = $.path.join(dotAppPath, "discord.deb");

    await streamDownload(
      "https://discord.com/api/download?platform=linux&format=deb",
      debInstallerPath,
    );

    await $`sudo apt install -y ${debInstallerPath}`;
  }
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
