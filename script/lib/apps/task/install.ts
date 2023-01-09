#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("task")) === "undefined";
if (notInstalled) {
  if ($.env.OS === "darwin") {
    await $`brew install go-task`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    invariant(
      typeof (await $.which("snap")) !== "undefined",
      `snap is required, install it with ${$.colors.magenta("pam install -a snapd")}`,
    );

    await $`sudo snap install task --classic`;
  }
}

const versionOutput = await $`task --version`.text(); // Task version: v3.19.1 (h1:2KMJk6mDBacSPuFxPFvlvvHJwGZtU/hN2ENZpaFqR5s=)
const version = versionOutput.split(" ")?.at(2)?.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
