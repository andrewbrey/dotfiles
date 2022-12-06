#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dirname, dedent, env, osInvariant } from "../../mod.ts";
import { constants } from "../_cli/pamkit.ts";

osInvariant();

const dotAppPath = $.path.join($dirname(import.meta.url), constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const installRootPath = $.path.join("usr", "lib", "pop-launcher", "scripts");
const dirLinkInstallPath = $.path.join(installRootPath, env.USER);

const installed = await $.exists(dirLinkInstallPath);
if (installed) {
  $.logGroup(() => {
    $.logWarn(
      "warn:",
      dedent(`
    			installation is managed; skipping manual update

    		`),
    );
  });
}
