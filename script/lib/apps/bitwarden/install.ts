#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, invariant, osInvariant } from "../../mod.ts";
import { constants, createAndLinkNativefierApp, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const server = Deno.env.get("SECRET_BITWARDEN_SERVER");
invariant(
  typeof server === "string" && server.length > 0,
  "missing required env $SECRET_BITWARDEN_SERVER",
);

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const name = $dirname(import.meta.url, true);
const notInstalled = typeof (await $.which(name)) === "undefined";
if (notInstalled) {
  await createAndLinkNativefierApp({
    appName: name,
    displayName: "Bitwarden",
    website: server,
  });
}

const meta: InstallerMeta = {
  name,
  path: $dirname(import.meta.url),
  type: "installed-manual",
  version: "0.0.0",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
