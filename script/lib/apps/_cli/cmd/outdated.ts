import { $, colors, command, table } from "../../../mod.ts";
import { calculateAppsInScope, getInstallerMetas, OutdatedCheck } from "../pamkit.ts";

export const outdated = new command.Command()
  .description("Check if one or more available apps is outdated.")
  .option("--all", "Check if all available apps are outdated.")
  .option(
    "-a, --app <app_name:string>",
    "Check if one or more specific apps is outdated (repeatable).",
    { collect: true },
  )
  .option(
    "-g, --group <app_group_name:string>",
    "Check if one or more specific app groups contains outdated apps (repeatable).",
    { collect: true },
  )
  .action(async ({ all, app = [], group = [] }, ...args) => {
    const inScope = await calculateAppsInScope({
      all: Boolean(all),
      installed: false,
      uninstalled: false,
      apps: app,
      groups: group,
    });

    const metasForScope = await getInstallerMetas(inScope);
    const installedManual = metasForScope.filter((m) => m.type === "installed-manual");
    const uninstalledOrManaged = metasForScope.filter((m) => m.type !== "installed-manual");

    // =====
    // warn about skipped app names
    // =====
    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const skipList = lister.format(uninstalledOrManaged.map((i) => colors.blue(i.name)));
    if (uninstalledOrManaged.length) {
      $.logWarn(
        "warn:",
        `skipping ${skipList} because ${
          uninstalledOrManaged.length > 1 ? "they are" : "it is"
        } not manually installed.`,
      );
    }

    if (installedManual.length) {
      const checkResults: OutdatedCheck[] = [];
      for (const meta of installedManual) {
        const outdatedScript = $.path.join(meta.path, "outdated.ts");

        checkResults.push(await $`zsh -c ${outdatedScript}`.printCommand(false).json());
      }

      const t = new table.Table()
        .padding(4)
        .header(
          table.Row.from(
            ["Name", "Installed Version", "Latest Version", "Check Skip Reason"].map(
              colors.blue,
            ),
          ),
        )
        .body(
          checkResults
            .sort((l1, l2) => l1.name.localeCompare(l2.name))
            .map((cr) => {
              const current = cr.current ?? "-";
              const latest = cr.latest
                ? cr.outdated ? colors.green(colors.bold(cr.latest)) : cr.latest
                : "-";
              const skip = cr.skip || "-";

              return table.Row.from([cr.name, current, latest, skip]);
            }),
        );

      $.log("");
      $.log(t.toString());
    } else {
      $.logWarn(
        "warn:",
        "no candidates for outdated check were in scope; did you include any apps/groups?",
      );
    }
  });
