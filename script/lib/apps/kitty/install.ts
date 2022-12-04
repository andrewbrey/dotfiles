#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land,sw.kovidgoyal.net --allow-read --allow-write --allow-run

import { $, $dirname, colors, dedent, env, invariant, osInvariant } from "../../mod.ts";
import {
  constants,
  InstallerMeta,
  linkBinaryToUserPath,
  linkDesktopFileForApp,
  streamDownload,
} from "../_cli/pamkit.ts";

osInvariant();
invariant(
  typeof (await $.which("xz")) !== "undefined",
  `xz-utils is required, install it with ${colors.magenta("pam install -a core-tools")}`,
);

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const notInstalled = typeof (await $.which("kitty")) === "undefined";
if (notInstalled) {
  if (env.OS === "darwin") {
    await $`brew install --cask kitty`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    const installScriptPath = $.path.join(dotAppPath, "kitty.sh");
    const kittyInstall = $.path.join(dotAppPath, "kitty.app");
    const kittyBin = $.path.join(kittyInstall, "bin", "kitty");
    const kittyLauncher = $.path.join(env.STANDARD_DIRS.DOT_DOTS_APPS, "kitty", ".launcher");

    await streamDownload("https://sw.kovidgoyal.net/kitty/installer.sh", installScriptPath);
    await Deno.chmod(installScriptPath, constants.executableMask);

    await $`${installScriptPath} dest=${dotAppPath} launch="n"`;
    await linkDesktopFileForApp("kitty");
    await linkBinaryToUserPath(kittyBin, "kitty");

    const xTerminalEmulator = await $.which("x-terminal-emulator");
    if (typeof xTerminalEmulator !== "undefined") {
      await $`sudo update-alternatives --install ${xTerminalEmulator} x-terminal-emulator ${kittyLauncher} 50`;
    }

    // TODO(mac): does this need to happen for mac too?
    await $`sudo mkdir -p /root/.terminfo/x`;
    await $`sudo ln -sf ${kittyInstall}/lib/kitty/terminfo/x/xterm-kitty /root/.terminfo/x/xterm-kitty`;

    $.logWarn(
      "warn:",
      dedent(`
				you can set the default terminal to kitty with:

				${colors.magenta("sudo update-alternatives --config x-terminal-emulator")}

			`),
    );
  }
}

const versionOutput = await $`kitty --version`.text(); // kitty 0.26.5 created by Kovid Goyal
const version = versionOutput.split(" ")[1];

const meta: InstallerMeta = {
  name: $.path.basename($dirname(import.meta.url)),
  path: $dirname(import.meta.url),
  type: env.OS === "darwin" ? "installed-managed" : "installed-manual",
  version,
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
