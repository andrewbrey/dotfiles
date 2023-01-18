#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("supabase")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    await $`brew install supabase/tap/supabase`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.jsonReleaseInfoName);
    const debInstallerPath = $.path.join(dotAppPath, "supabase.deb");

    const releaseInfo = await $.ghReleaseInfo("supabase", "cli");
    await Deno.writeTextFile(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));

    const { assets, tag_name } = releaseInfo;
    const latestVersion = tag_name.split("v")?.at(1) ?? "0.0.0";
    const targetName = `supabase_${latestVersion}_linux_amd64.deb`;
    const targetAsset = assets.find((a) => a.name === targetName);

    invariant(typeof targetAsset !== "undefined", "no suitable installation target found");

    await $.streamDownload(targetAsset.browser_download_url, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;
  }
}

const version = await $`supabase --version`.text(); // 1.27.10

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
