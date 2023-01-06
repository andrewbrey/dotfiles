#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, dedent, osInvariant } from "../../mod.ts";

osInvariant();
$.logGroup(() => {
  $.logWarn(
    "warn:",
    dedent(`
			installation is managed; skipping manual update

		`),
  );
});
