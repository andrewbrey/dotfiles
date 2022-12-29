#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("brave-browser")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask brave-browser`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    if (Math.random()) throw new Error("TODO: implement installer");
    // TODO: install according to brave website (also reference docker installer), e.g.:

    /*
			sudo apt install curl

			sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg

			echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main"|sudo tee /etc/apt/sources.list.d/brave-browser-release.list

			sudo apt update

			sudo apt install brave-browser
		*/
  }
}

const versionOutput = await $`brave-browser --version`.text(); // v0.22.1
const version = versionOutput.split("v")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
