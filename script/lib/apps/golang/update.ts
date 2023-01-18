#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("go")) {
  if ($.env.OS /* TODO: refactor to os helpers */ === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        $.dedent`
    			installation is managed; skipping manual update

    		`,
      );
    });
  } else {
    const releaseInfoPath = $.path.join(dotAppPath, pamkit.constants.plainReleaseInfoName);
    const latestVersion = await $.request("https://golang.org/VERSION?m=text").text();

    await Deno.writeTextFile(releaseInfoPath, latestVersion);

    const artifactPath = $.path.join(dotAppPath, "golang.tar.gz");

    await $.streamDownload(
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

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
