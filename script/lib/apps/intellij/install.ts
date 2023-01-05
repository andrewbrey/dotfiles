#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, colors, env, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("intellij-idea-ultimate")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask intellij-idea`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    invariant(
      typeof (await $.which("snap")) !== "undefined",
      `snap is required, install it with ${colors.magenta("pam install -a snapd")}`,
    );

    await $`sudo snap install intellij-idea-ultimate --classic`;
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
