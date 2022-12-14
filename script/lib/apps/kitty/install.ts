#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land,sw.kovidgoyal.net --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";
import {
  constants,
  InstallerMeta,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
} from "../_cli/pamkit.ts";

await $.requireCommand("xz", "pam install -a core-tools");

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

if (await $.commandMissing("kitty")) {
  if ($.env.OS === "darwin") {
    await $`brew install --cask kitty`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const installScriptPath = $.path.join(dotAppPath, "kitty.sh");
    const kittyInstall = $.path.join(dotAppPath, "kitty.app");
    const kittyBin = $.path.join(kittyInstall, "bin", "kitty");

    await $.streamDownload("https://sw.kovidgoyal.net/kitty/installer.sh", installScriptPath);
    await Deno.chmod(installScriptPath, constants.executableMask);

    await $`${installScriptPath} dest=${dotAppPath} launch="n"`;
    await linkDesktopFileForApp("kitty");
    const linkPath = await linkBinaryToUserPath(kittyBin, "kitty");

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
}

const versionOutput = await $`kitty --version`.text(); // kitty 0.26.5 created by Kovid Goyal
const version = versionOutput.split(" ")?.at(1);

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: $.env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
