#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write

import { $, blackOnYellow, colors, doneWith, env, osInvariant } from "../mod.ts";

osInvariant();

const id = `==> ${$.path.basename(import.meta.url)}`;

$.logGroup(blackOnYellow(id));

$.logStep("step: place standard dirs");

for (const [name, path] of Object.entries(env.STANDARD_DIRS)) {
  $.logLight(
    `ensuring presence of ${colors.magenta(name.toLocaleLowerCase())} directory at ${
      colors.magenta(path)
    }`,
  );
  await $.fs.ensureDir(path);
}

$.logStep("step: place standard files");

await $.fs.ensureFile(`${env.HOME}/.hushlogin`);
await $.fs.ensureDir(`${env.HOME}/.dots`);

const dotExtra = `${env.HOME}/.dots/.extra`;
if (!(await $.exists(dotExtra))) {
  await Deno.writeTextFile(
    dotExtra,
    `#!/usr/bin/env zsh

# =====
# chezmoi ignored
# =====
#
# this file can contain shell-exports (variables, functions, and aliases) that
# are ignored by dotfiles management.

`,
  );
}

$.logGroupEnd();

doneWith(id);
