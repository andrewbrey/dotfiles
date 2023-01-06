#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-run --allow-write

import { $, blackOnYellow, doneWith, env, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

$.logStep("step: ensure presence of zsh");

let zshBin = await $.which("zsh");
if (!zshBin) {
  $.logWarn("warn: zsh not found");
  $.logGroup();

  $.logStep("installing zsh...");
  switch (env.OS) {
    case "linux":
      await $`sudo apt install -y zsh`;

      zshBin = await $.which("zsh");
      if (!zshBin) throw new Error("still unable to find zsh; something unusual is going on");

      $.logLight(`zsh now available at ${zshBin}`);

      break;
    case "darwin":
      await $`brew install zsh`;

      zshBin = await $.which("zsh");
      if (!zshBin) throw new Error("still unable to find zsh; something unusual is going on");

      $.logLight(`zsh now available at ${zshBin}`);

      break;
    default:
      Deno.exit(1);
  }

  $.logGroupEnd();
} else {
  $.logLight(`zsh available at ${zshBin}`);
}

$.logStep("step: set zsh as default shell for root");
await $`sudo chsh -s ${zshBin} root`;

$.logStep(`step: set zsh as default shell for ${env.USER}`);
await $`sudo chsh -s ${zshBin} ${env.USER}`;

$.logStep("step: ensure presence of zgenom plugin manager");
const zgenInstallPath = $.path.join(env.HOME, ".zgenom");
if (!(await $.exists(zgenInstallPath))) {
  await $`git clone https://github.com/jandamm/zgenom.git ${zgenInstallPath}`;

  $.logLight(`zgenom plugin manager is now available at ${zgenInstallPath}`);
} else {
  $.logLight(`zgenom plugin manager is available at ${zgenInstallPath}`);
}

$.logStep("step: ensure no previously compiled zcompdump files exist");
const dumps: string[] = [];
for await (const file of $.fs.expandGlob(`${env.HOME}/.zcompdump*`)) {
  if (file.isFile) dumps.push(file.path);
}
if (dumps.length > 0) {
  await $`rm -f ${dumps}`;
}

$.logGroupEnd();

doneWith(id);
