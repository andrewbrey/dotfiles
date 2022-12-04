#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, dedent, osInvariant } from "../../mod.ts";
import { constants, getInstallerMetas } from "../_cli/pamkit.ts";

osInvariant();

$.logGroup(() => {
  $.logWarn(
    "warn:",
    dedent(`
			installation is managed; skipping manual update

		`),
  );
});
