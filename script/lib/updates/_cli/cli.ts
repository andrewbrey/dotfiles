#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, $dotdot, colors, command, dateFns, dedent } from "../../mod.ts";
import { getUpdaterNames } from "./dumkit.ts";

const dumoji = `${colors.yellow("⊂(◉‿◉)つ")}`;
const dum = `${colors.yellow("Dum")}`;

await new command.Command()
  .name("dum")
  .version("1.0.0")
  .description(`${dumoji} -- {(Hello, I'm ${dum}, your daily updates manager)}`)
  .arguments("[...app_names:string]")
  .option("--list", "List all available updaters.")
  .action(async ({ list }, ...argAppNames) => {
    const allUpdaters = Array.from(await getUpdaterNames());

    if (list) {
      $.log("");
      $.log(colors.blue("Updaters"));

      for (const name of allUpdaters) {
        $.logLight(name);
      }

      return;
    }

    const toUpdate = argAppNames.length
      ? allUpdaters.filter((u) => argAppNames.includes(u))
      : allUpdaters;

    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const toUpdateList = lister.format(toUpdate.map((name) => colors.blue(name)));

    if (toUpdate.length) {
      $.log(`Running updates for ${toUpdateList}`);
      $.log("");

      for (const [idxStr, name] of Object.entries(toUpdate)) {
        const idx = parseInt(idxStr);
        const updateScript = $.path.join($dotdot(import.meta.url), name, "update.ts");

        if (idx > 0) $.log("");
        $.log(dedent`
					# ${colors.yellow("=====")}
					# Starting ${colors.blue(name)} update (task ${idx + 1} of ${toUpdate.length})
					# ${colors.yellow("=====")}
				`);
        $.log("");

        const startTime = Date.now();
        await $`zsh -c ${updateScript}`.printCommand(false);

        $.log("");
        $.log(dedent`
					# ${colors.green("=====")}
					# Done with ${colors.blue(name)} update in about ${
          colors.magenta(
            dateFns.formatDistanceToNowStrict(startTime),
          )
        }
					# ${colors.green("=====")}
				`);
      }
    } else {
      $.logWarn("warn:", "no updaters were found");
    }
  })
  .parse(Deno.args);
