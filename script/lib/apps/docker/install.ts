#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, InstallerMeta } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("docker")) === "undefined";
if (notInstalled) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask docker`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await $`sudo mkdir -p /etc/apt/keyrings`;
    await $`sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg`.stdin(
      await $`curl -fsSL https://download.docker.com/linux/ubuntu/gpg`.text(),
    );

    const arch = await $`dpkg --print-architecture`.text();
    const codename = await $`lsb_release -cs`.text();

    await $`sudo tee /etc/apt/sources.list.d/docker.list`.stdin(
      await $
        .raw`echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${codename} stable"`
        .text(),
    );

    await $`sudo apt update`;
    await $`sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin`;

    const dockerGroupExists = (await $`grep -q "^docker:" /etc/group`.noThrow()).code === 0;
    if (!dockerGroupExists) {
      await $`sudo groupadd docker`;
    }

    const usersGroupsRaw = await $`id -nGz $USER`.text();
    const usersGroups = await $`tr '\\0' '\\n'`.stdin(usersGroupsRaw).text();
    const userInGroup = (await $`grep -q '^docker$'`.stdin(usersGroups).noThrow()).code === 0;
    if (!userInGroup) {
      await $`sudo usermod -aG docker $USER`;
    }

    $.logWarn("warn:", "you need to log out and back in to enable sudo-less docker access");
  }
}

const versionOutput = await $`docker --version`.text(); // Docker version 20.10.21, build baeda1f
const version = versionOutput.split(" ")?.at(2)?.split(",")?.at(0) ?? "";

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
