#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,starship.rs --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("starship")) {
  // NOTE: copied from script/lib/init/02-zsh-and-zgenom.ts

  const installScript = await Deno.makeTempFile({ prefix: "dotfiles_starship_", suffix: ".sh" });
  const starshipInstallSource = "https://starship.rs/install.sh";
  await Deno.writeTextFile(installScript, await $.request(starshipInstallSource).text());
  await Deno.chmod(installScript, 0o744);

  await $`sudo sh ${installScript} --yes`;
}

const versionOutput = await $`starship --version`.lines(); // starship 1.11.0\n....
const version = versionOutput?.at(0)?.split(" ")?.at(1) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
