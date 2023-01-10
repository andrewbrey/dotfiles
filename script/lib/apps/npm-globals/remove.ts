#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), constants.appArtifactsDir);

$.logGroup(() => {
  $.logWarn(
    "warn:",
    $.dedent`
			actual node_module lib & bin files are being left untouched
			because there is no good way to know which have been added
			or removed since initial installation - remove them manually
			within ${$.colors.magenta($.env.STANDARD_DIRS.NPM_INSTALL)}.
		`,
  );
});

if (await $.exists(dotAppPath)) {
  await Deno.remove(dotAppPath, { recursive: true });
}
