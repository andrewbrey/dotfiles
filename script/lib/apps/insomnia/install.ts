#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  InstallerMeta,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();

let version = "";
const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("insomnia")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask insomnia`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.htmlReleaseInfoName);
    const binPath = $.path.join(dotAppPath, "insomnia.AppImage");

    await streamDownload("https://insomnia.rest/changelog", releaseInfoPath);
    const latestReleasePageText = await Deno.readTextFile(releaseInfoPath);
    const latestVersion = latestReleasePageText.match(/id="(\d+\.\d+\.\d+)"/)?.at(1) ?? ""; // id="2022.7.0"

    invariant(
      typeof latestVersion === "string" && latestVersion.length > 0,
      "invalid latest version",
    );

    const targetAsset =
      `https://github.com/Kong/insomnia/releases/download/core@${latestVersion}/Insomnia.Core-${latestVersion}.AppImage`;

    await streamDownload(targetAsset, binPath);
    await linkBinaryToUserPath(binPath, "insomnia");
    await linkDesktopFileForApp("insomnia");

    version = latestVersion;
  }
}

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
