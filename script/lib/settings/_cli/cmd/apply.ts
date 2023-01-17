import { $ } from "../../../mod.ts";
import { samkit } from "../samkit.ts";

export const apply = new $.cliffy.cmd.Command()
  .description("Apply all available settings.")
  .option("--skip-confirm", "Automatically bypass confirmation prompts.")
  .action(async ({ skipConfirm }, ...args) => {
    const allSettings = Array.from(await samkit.getSettingNames());

    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const toApplyList = lister.format(allSettings.map((name) => $.colors.blue(name)));

    if (allSettings.length) {
      const autoProceed = !$.env.STDIN_IS_TTY || Boolean(skipConfirm);

      if (autoProceed) {
        $.log(`About to apply your ${toApplyList} settings.`);
        $.log("");
      }

      const proceed = !autoProceed
        ? await $.confirm(`About to apply your ${toApplyList} settings. Proceed?`, {
          default: true,
        })
        : true;

      if (!proceed) Deno.exit(1);

      for (const [idxStr, name] of Object.entries(allSettings)) {
        const idx = parseInt(idxStr);
        const applyScript = $.path.join($.$dotdot(import.meta.url, 2), name, "apply.ts");

        if (idx > 0) $.log("");
        $.log($.dedent`
					# ${$.colors.yellow("=====")}
					# Starting ${$.colors.blue(name)} application (task ${idx + 1} of ${allSettings.length})
					# ${$.colors.yellow("=====")}
				`);
        $.log("");

        const startTime = Date.now();
        await $`zsh -c ${applyScript}`.printCommand(false);

        $.log("");
        $.log($.dedent`
					# ${$.colors.green("=====")}
					# Done with ${$.colors.blue(name)} application in about ${
          $.colors.magenta(
            $.dateFns.formatDistanceToNowStrict(startTime),
          )
        }
					# ${$.colors.green("=====")}
				`);
      }
    } else {
      $.logWarn("warn:", "no settings were found to apply");
    }
  });
