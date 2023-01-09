#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

invariant(
  typeof (await $.which("snap")) !== "undefined",
  `snap is required, install it with ${$.colors.magenta("pam install -a snapd")}`,
);

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if ($.env.OS === "linux") {
  if (typeof (await $.which("snapcraft")) === "undefined") {
    await $`sudo snap install snapcraft --classic`;
  }

  if (typeof (await $.which("snap-review")) === "undefined") {
    await $`sudo snap install review-tools`;
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
