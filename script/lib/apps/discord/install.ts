#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("discord")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask discord`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const debInstallerPath = $.path.join(dotAppPath, "discord.deb");

    await $.streamDownload(
      "https://discord.com/api/download?platform=linux&format=deb",
      debInstallerPath,
    );

    await $`sudo apt install -y ${debInstallerPath}`;
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
