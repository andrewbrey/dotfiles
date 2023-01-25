#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,api.github.com,github.com,objects.githubusercontent.com,sw.kovidgoyal.net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

await $.requireCommand("xz", "pam install -a core-tools");

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

await $.onMac(async () => {
  if (await pamkit.brewAppMissing("kitty")) {
    await $`brew install --cask kitty`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  }
});

await $.onLinux(async () => {
  if (await $.commandMissing("kitty")) {
    const installScriptPath = $.path.join(dotAppPath, "kitty.sh");
    const kittyInstall = $.path.join(dotAppPath, "kitty.app");
    const kittyBin = $.path.join(kittyInstall, "bin", "kitty");

    await $.streamDownload("https://sw.kovidgoyal.net/kitty/installer.sh", installScriptPath);
    await Deno.chmod(installScriptPath, pamkit.constants.executableMask);

    await $`${installScriptPath} dest=${dotAppPath} launch="n"`;
    await pamkit.linkDesktopFileForApp("kitty");
    const linkPath = await pamkit.linkBinaryToUserPath(kittyBin, "kitty");

    const xTerminalEmulator = await $.which("x-terminal-emulator");
    if (typeof xTerminalEmulator !== "undefined") {
      await $`sudo update-alternatives --install ${xTerminalEmulator} x-terminal-emulator ${linkPath} 50`;
    }

    // TODO(mac): does this need to happen for mac too?
    await $`sudo mkdir -p /root/.terminfo/x`;
    await $`sudo ln -sf ${kittyInstall}/lib/kitty/terminfo/x/xterm-kitty /root/.terminfo/x/xterm-kitty`;

    $.logWarn(
      "warn:",
      $.dedent`
				you can set the default terminal to kitty with:

				${$.colors.magenta("sudo update-alternatives --config x-terminal-emulator")}

			`,
    );
  }
});

const versionOutput = await $`kitty --version`.text(); // kitty 0.26.5 created by Kovid Goyal
const version = versionOutput.split(" ")?.at(1);

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
