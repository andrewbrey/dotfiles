#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, flatpakAppMissing, InstallerMeta } from "../_cli/pamkit.ts";

invariant(typeof (await $.which("flatpak")) !== "undefined", "flatpak is required");

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = await flatpakAppMissing("PCSX2");
if (notInstalled) {
  if ($.env.OS === "linux") {
    await $`flatpak install -y flathub net.pcsx2.PCSX2`;
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
