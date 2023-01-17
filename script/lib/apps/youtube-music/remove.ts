#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);

if ($.env.OS === "darwin") {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      $.dedent`
				manual uninstallation required for apps installed with dmg;
				start by trashing ".app" archive in /Applications but beware
				that other files may have been placed on the system during
				installation.

			`,
    );
  });
} else {
  if (await $.commandExists("youtube-music")) {
    await pamkit.unlinkDesktopFileForApp("youtube-music");
    await pamkit.unlinkBinaryFromUserPath("youtube-music");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
