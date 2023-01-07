#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, env, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas, streamDownload } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await getInstallerMetas(new Set([$dirname(import.meta.url, true)]));

const installed = typeof (await $.which("kitty")) !== "undefined";
if (installed) {
  if (env.OS === "darwin") {
    $.logGroup(() => {
      $.logWarn(
        "warn:",
        $.dedent`
    			installation is managed; skipping manual update

    		`,
      );
    });
  } else {
    const installScriptPath = $.path.join(dotAppPath, "kitty.sh");

    await streamDownload("https://sw.kovidgoyal.net/kitty/installer.sh", installScriptPath);
    await Deno.chmod(installScriptPath, constants.executableMask);

    await $`${installScriptPath} dest=${dotAppPath} launch="n"`;

    meta.lastCheck = Date.now();
  }
}

const versionOutput = await $`kitty --version`.text(); // kitty 0.26.5 created by Kovid Goyal
const version = versionOutput.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
