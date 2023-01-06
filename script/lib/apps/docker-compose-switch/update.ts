#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,api.github.com --allow-read --allow-write --allow-run

import { $, $dirname, dedent, env, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas, ghReleaseLatestInfo } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));
let version = "0.0.0"; // special for compose-switch because at runtime, it's --version flag reports `docker compose` version, not the version of the compose-switch utility itself
const installed = typeof (await $.which("compose-switch")) !== "undefined";
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
    await $`sudo sh`.stdin(
      await $`curl -fL https://raw.githubusercontent.com/docker/compose-switch/master/install_on_linux.sh`
        .text(),
    );

    const releaseInfo = await ghReleaseLatestInfo("docker", "compose-switch");
    const { tag_name } = releaseInfo;
    version = tag_name.split("v")?.at(1) ?? "";

    meta.lastCheck = Date.now();
    meta.version = version;
  }
}

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
