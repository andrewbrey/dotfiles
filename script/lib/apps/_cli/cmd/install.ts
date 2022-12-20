import { $, colors, command, dateFns, dedent, env, prompts } from "../../../mod.ts";
import { calculateAppsInScope, getInstallerMetas } from "../pamkit.ts";

export const install = new command.Command()
  .description("Install one or more available apps.")
  .alias("i")
  .option("--all", "Install all available apps.")
  .option(
    "-a, --app <app_name:string>",
    "Install one or more specific apps (repeatable).",
    { collect: true },
  )
  .option(
    "-g, --group <app_group_name:string>",
    "Install one or more specific app groups (repeatable).",
    { collect: true },
  )
  .option("--skip-confirm", "Automatically bypass confirmation prompts.")
  .option("--allow-reinstall", "Allow installation of apps that are already installed.")
  .action(async ({ all, app = [], group = [], skipConfirm, allowReinstall }, ...args) => {
    const inScope = await calculateAppsInScope({
      all: Boolean(all),
      installed: false,
      uninstalled: false,
      apps: app,
      groups: group,
    });

    const metasForScope = await getInstallerMetas(inScope);
    const installed = metasForScope.filter((m) => m.type !== "uninstalled");
    const uninstalled = metasForScope.filter((m) => m.type === "uninstalled");

    const toInstall = Boolean(allowReinstall) ? [...metasForScope] : [...uninstalled];

    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const toInstallList = lister.format(toInstall.map((i) => colors.blue(i.name)));

    if (!allowReinstall) {
      // =====
      // warn about skipped app names
      // =====
      const skipList = lister.format(installed.map((i) => colors.blue(i.name)));
      if (installed.length) {
        $.logWarn(
          "warn:",
          `skipping ${skipList} because ${
            installed.length > 1 ? "they are" : "it is"
          } already installed.`,
        );
      }
    }

    if (toInstall.length) {
      const autoProceed = !env.STDIN_IS_TTY || Boolean(skipConfirm);

      if (autoProceed) {
        $.log(`About to install ${toInstallList}.`);
        $.log("");
      }

      const proceed = !autoProceed
        ? await prompts.Confirm.prompt({
          message: `About to install ${toInstallList}. Proceed?`,
          default: true,
        })
        : true;

      if (!proceed) Deno.exit(1);

      for (const [idxStr, meta] of Object.entries(toInstall)) {
        const idx = parseInt(idxStr);
        const installScript = $.path.join(meta.path, "install.ts");

        if (idx > 0) $.log("");
        $.log(dedent`
					# ${colors.yellow("=====")}
					# Starting ${colors.blue(meta.name)} installation (task ${idx + 1} of ${toInstall.length})
					# ${colors.yellow("=====")}
				`);
        $.log("");

        const startTime = Date.now();
        await $`zsh -c ${installScript}`.printCommand(false);

        $.log("");
        $.log(dedent`
					# ${colors.green("=====")}
					# Done with ${colors.blue(meta.name)} installation in about ${
          colors.magenta(
            dateFns.formatDistanceToNowStrict(startTime),
          )
        }
					# ${colors.green("=====")}
				`);
      }
    } else {
      $.logWarn(
        "warn:",
        "no candidates for installation were in scope; did you include any apps/groups?",
      );
    }
  });
