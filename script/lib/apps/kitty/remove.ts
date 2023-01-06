#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, colors, dedent, env, osInvariant } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);

const isInstalled = typeof (await $.which("kitty")) !== "undefined";
if (isInstalled) {
  if (env.OS === "darwin") {
    await $`brew uninstall --cask kitty`.env({ HOMEBREW_NO_ANALYTICS: "1" });
  } else {
    await unlinkDesktopFileForApp("kitty");
    const linkPath = await unlinkBinaryFromUserPath("kitty");

    const xTerminalEmulator = await $.which("x-terminal-emulator");
    if (typeof xTerminalEmulator !== "undefined") {
      await $`sudo update-alternatives --remove ${xTerminalEmulator} x-terminal-emulator ${linkPath}`;
    }

    await $`sudo rm -f /root/.terminfo/x/xterm-kitty`;

    $.logWarn(
      "warn:",
      dedent(`
				you can set the default terminal to something other than kitty with:

				${colors.magenta("sudo update-alternatives --config x-terminal-emulator")}

			`),
    );
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
