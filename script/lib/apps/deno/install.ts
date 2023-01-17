#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("deno")) {
  const installScriptPath = $.path.join(dotAppPath, "deno-install.sh");

  await $.streamDownload("https://deno.land/x/install/install.sh", installScriptPath);
  await Deno.chmod(installScriptPath, pamkit.constants.executableMask);

  await $`${installScriptPath}`;
}

const versionOutput = await $`deno --version`.lines(); // deno 1.29.1 (release, x86_64-unknown-linux-gnu)\n...
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
