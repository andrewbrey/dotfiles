#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("openvpn")) {
  if ($.env.OS === "darwin") {
    await $`brew install openvpn`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo apt install -y network-manager-openvpn-gnome`;
  }
}

const versionOutput = await $`openvpn --version`.lines(); // OpenVPN 2.5.5 x86_64-pc-linux-gnu...\n...
const version = versionOutput?.at(0)?.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
