import { $ } from "../../../mod.ts";
import { pamkit } from "../pamkit.ts";

export const remove = new $.cliffy.cmd.Command()
  .description("Remove one or more available apps.")
  .alias("uninstall")
  .arguments("[...app_names:string]")
  .option("--all", "Remove all available apps.")
  .option(
    "-a, --app <app_name:string>",
    "Remove one or more specific apps (repeatable).",
    { collect: true },
  )
  .option(
    "-g, --group <app_group_name:string>",
    "Remove one or more specific app groups (repeatable).",
    { collect: true },
  )
  .option("--skip-confirm", "Automatically bypass confirmation prompts.")
  .action(async ({ all, app = [], group = [], skipConfirm }, ...argAppNames) => {
    const apps = [...argAppNames, ...app];

    const inScope = await pamkit.calculateAppsInScope({
      all: Boolean(all),
      installed: false,
      uninstalled: false,
      apps,
      groups: group,
    });

    const metasForScope = await pamkit.getInstallerMetas(inScope);
    const installed = metasForScope.filter((m) => m.type !== "uninstalled");
    const uninstalled = metasForScope.filter((m) => m.type === "uninstalled");

    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const toRemoveList = lister.format(installed.map((i) => $.colors.blue(i.name)));

    // =====
    // warn about skipped app names
    // =====
    const skipList = lister.format(uninstalled.map((i) => $.colors.blue(i.name)));
    if (uninstalled.length) {
      $.logWarn(
        "warn:",
        `skipping ${skipList} because ${
          uninstalled.length > 1 ? "they are" : "it is"
        } not installed.`,
      );
    }

    if (installed.length) {
      const autoProceed = !$.env.STDIN_IS_TTY || Boolean(skipConfirm);

      if (autoProceed) {
        $.log(`About to remove ${toRemoveList}.`);
        $.log("");
      }

      const proceed = !autoProceed
        ? await $.confirm(`About to remove ${toRemoveList}. Proceed?`, {
          default: true,
        })
        : true;

      if (!proceed) Deno.exit(1);

      for (const [idxStr, meta] of Object.entries(installed)) {
        const idx = parseInt(idxStr);
        const removalScript = $.path.join(meta.path, "remove.ts");

        if (idx > 0) $.log("");
        $.log($.dedent`
					# ${$.colors.yellow("=====")}
					# Starting ${$.colors.blue(meta.name)} removal (task ${idx + 1} of ${installed.length})
					# ${$.colors.yellow("=====")}
				`);
        $.log("");

        const startTime = Date.now();
        await $`zsh -c ${removalScript}`.printCommand(false);

        $.log("");
        $.log($.dedent`
					# ${$.colors.green("=====")}
					# Done with ${$.colors.blue(meta.name)} removal in about ${
          $.colors.magenta(
            $.dateFns.formatDistanceToNowStrict(startTime),
          )
        }
					# ${$.colors.green("=====")}
				`);
      }
    } else {
      $.logWarn(
        "warn:",
        "no candidates for removal were in scope; did you include any apps/groups?",
      );
    }
  });
