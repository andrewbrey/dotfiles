#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

$.logGroup(() => {
	$.logWarn(
		"warn:",
		$.dedent`
			installation is managed; skipping manual update

		`,
	);
});
