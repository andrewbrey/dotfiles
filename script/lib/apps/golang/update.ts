#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $, $dirname, dedent, env, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("go")) !== "undefined";
if (installed) {
  if (env.OS === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        dedent(`
    			installation is managed; skipping manual update

    		`),
      );
    });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, constants.plainReleaseInfoName);
    const latestVersion = await $.request("https://golang.org/VERSION?m=text").text();

    await Deno.writeTextFile(releaseInfoPath, latestVersion);

    const artifactPath = $.path.join(dotAppPath, "golang.tar.gz");

    await streamDownload(
      `https://golang.org/dl/${latestVersion}.linux-amd64.tar.gz`,
      artifactPath,
    );

    await $`sudo rm -rf /usr/local/go`;
    await $`sudo tar -C /usr/local -xzf ${artifactPath}`;

    meta.lastCheck = Date.now();
  }
}

const versionOutput = await $`go version`.text(); // go version go1.16.5 linux/amd64
const version = versionOutput.split(" ")?.at(2)?.split("go")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
