#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant } from "../../mod.ts";
import { constants, ghReleaseLatestInfo, InstallerMeta, streamDownload } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("deno")) === "undefined";
if (notInstalled) {
  const installScriptPath = $.path.join(dotAppPath, "deno-install.sh");

  await streamDownload("https://deno.land/x/install/install.sh", installScriptPath);
  await Deno.chmod(installScriptPath, constants.executableMask);

  await $`${installScriptPath}`;
}

const versionOutput = await $`deno --version`.lines(); // deno 1.29.1 (release, x86_64-unknown-linux-gnu)\n...
const version = versionOutput?.at(0)?.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
