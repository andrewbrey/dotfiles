#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("shotcut")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask shotcut`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    invariant(
      typeof (await $.which("snap")) !== "undefined",
      `snap is required, install it with ${colors.magenta("pam install -a snapd")}`,
    );

    await $`sudo snap install shotcut --classic`;
  }
}

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
