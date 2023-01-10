#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,api.github.com --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

let version = "0.0.0"; // special for compose-switch because at runtime, it's --version flag reports `docker compose` version, not the version of the compose-switch utility itself
if (await $.commandMissing("docker-compose")) {
  if ($.env.OS === "linux") {
    $.requireCommand("docker", "pam install -a docker");

    invariant(
      (await $`docker compose version`.noThrow().text()).trim() !== "",
      "docker compose plugin is required and should have been installed by docker",
    );

    await $`sudo sh`.stdin(
      await $`curl -fL https://raw.githubusercontent.com/docker/compose-switch/master/install_on_linux.sh`
        .bytes(),
    );

    const releaseInfo = await $.ghReleaseInfo("docker", "compose-switch");
    const { tag_name } = releaseInfo;
    version = tag_name.split("v")?.at(1) ?? "";
  }
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
