#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com,sw.kovidgoyal.net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const [meta] = await pamkit.getInstallerMetas(new Set([$.$dirname(import.meta.url, true)]));

if (await $.commandExists("kitty")) {
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
    const installScriptPath = $.path.join(dotAppPath, "kitty.sh");

    await $.streamDownload("https://sw.kovidgoyal.net/kitty/installer.sh", installScriptPath);
    await Deno.chmod(installScriptPath, pamkit.constants.executableMask);

    await $`${installScriptPath} dest=${dotAppPath} launch="n"`;

    meta.lastCheck = Date.now();
  }
}

const versionOutput = await $`kitty --version`.text(); // kitty 0.26.5 created by Kovid Goyal
const version = versionOutput.split(" ")?.at(1) ?? "";

meta.version = version;

const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);
await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
