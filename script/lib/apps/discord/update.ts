#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

$.logGroup(() => {
  $.logWarn(
    "warn:",
    $.dedent`
			installation is managed; skipping manual update

		`,
  );
});
