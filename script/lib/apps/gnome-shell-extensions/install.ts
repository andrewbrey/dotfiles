#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, getChezmoiData, invariant, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const chezmoiData = await getChezmoiData();
if (!chezmoiData.is_containerized && (chezmoiData.is_popos || chezmoiData.is_ubuntu)) {
  invariant(typeof (await $.which("dconf")) !== "undefined", "dconf is required");
  invariant(typeof (await $.which("gnome-shell")) !== "undefined", "gnome-shell is required");
  invariant(
    typeof (await $.which("gnome-extensions")) !== "undefined",
    "gnome-extensions is required",
  );
  // TODO: install extensions
}

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
