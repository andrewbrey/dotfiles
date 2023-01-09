#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, invariant } from "../../mod.ts";
import { constants, getUA, InstallerMeta, runInBrowser, streamDownload } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("dropbox")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask dropbox`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.htmlReleaseInfoName);
    const debInstallerPath = $.path.join(dotAppPath, "dropbox.deb");
    let releaseInfo = "";

    await runInBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.setUserAgent(getUA());
      await page.goto("https://www.dropbox.com/install-linux", { waitUntil: "networkidle2" });
      releaseInfo = await page.content();
    });

    invariant(releaseInfo.length > 0, "unable to fetch release information");

    await Deno.writeTextFile(releaseInfoPath, releaseInfo);

    const debURI = releaseInfo.match(/href="(\/download\?dl=packages.+ubuntu.+amd64\.deb)"/)
      ?.at(1); // <a href="/download?dl=packages/ubuntu/dropbox_2020.03.04_amd64.deb">64-bit</a>

    invariant(typeof debURI === "string" && debURI.length > 0, "unable to determine download");

    await streamDownload(`https://dropbox.com${debURI}`, debInstallerPath);

    await $`sudo apt install -y ${debInstallerPath}`;
  }
}

const versionOutput = await $`dropbox version`.lines(); // Dropbox daemon version: 164.3.7907\nDropbox command-line interface version: 2020.03.04
const version = versionOutput?.at(1)?.split(" ")?.at(-1) ?? "";

const meta: InstallerMeta = {
  name: $dirname(import.meta.url, true),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
