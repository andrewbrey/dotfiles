#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants, unlinkBinaryFromUserPath, unlinkDesktopFileForApp } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

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
  if (await $.commandExists("flot")) {
    await unlinkDesktopFileForApp("flot");
    await unlinkBinaryFromUserPath("flot");
  }
}

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
