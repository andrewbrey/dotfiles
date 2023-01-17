#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const asepriteToken = $.requireEnv("HUMBLE_ASEPRITE_TOKEN", "use_humble");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("aseprite")) {
  const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.htmlReleaseInfoName);
  let releaseInfo = "";

  await $.runInBrowser(async (page) => {
    await page.goto(`https://www.humblebundle.com/downloads?key=${asepriteToken}`, {
      waitUntil: "networkidle2",
    });
    releaseInfo = await page.content();
  });

  invariant(releaseInfo.length > 0, "unable to fetch release information");

  await Deno.writeTextFile(releaseInfoPath, releaseInfo);

  if ($.env.OS === "darwin") {
    const dmgInstallerPath = $.path.join(dotAppPath, "aseprite.dmg");
    const dmgURI = releaseInfo.match(/href="(https.*Aseprite-v\d+\.\d+\.\d+.*-macOS\.dmg.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof dmgURI === "string" && dmgURI.length > 0, "unable to determine download");

    await $.streamDownload(dmgURI, dmgInstallerPath);

    await pamkit.installDmg(dmgInstallerPath);
  } else {
    const debInstallerPath = $.path.join(dotAppPath, "aseprite.deb");
    const debURI = releaseInfo.match(/href="(https.*Aseprite_\d+\.\d+\.\d+.*_amd64\.deb.*)"/)
      ?.at(1)?.replaceAll("&amp;", "&");

    invariant(typeof debURI === "string" && debURI.length > 0, "unable to determine download");

    await $.streamDownload(debURI, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;

    meta.lastCheck = Date.now();
  }
}

const versionOutput = $.env.OS === "darwin" ? "" : await $`aseprite --version`.text(); // Aseprite 1.2.40-x64
const version = versionOutput.split(" ")?.at(1)?.split("-")?.at(0) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
