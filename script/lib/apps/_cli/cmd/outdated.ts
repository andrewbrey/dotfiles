import { $ } from "../../../mod.ts";
import { type OutdatedCheck, pamkit } from "../pamkit.ts";

export const outdated = new $.cliffy.cmd.Command()
  .description("Check if one or more available apps is outdated.")
  .arguments("[...app_names:string]")
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
  .action(async ({ all, app = [], group = [] }, ...argAppNames) => {
    const apps = [...argAppNames, ...app];
    const defaultListAll = !apps.length && !group.length;

    const inScope = await pamkit.calculateAppsInScope({
      all: all || defaultListAll,
      installed: false,
      uninstalled: false,
      apps,
      groups: group,
    });

    const metasForScope = await pamkit.getInstallerMetas(inScope);
    const installedManual = metasForScope.filter((m) => m.type === "installed-manual");
    const uninstalledOrManaged = metasForScope.filter((m) => m.type !== "installed-manual");

    // =====
    // warn about skipped app names
    // =====
    const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
    const skipList = lister.format(uninstalledOrManaged.map((i) => $.colors.blue(i.name)));
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

        try {
          checkResults.push(await $`zsh -c ${outdatedScript}`.printCommand(false).json());
        } catch (error) {
          checkResults.push({
            name: meta.name,
            current: meta.version,
            skip: $.colors.red("outdated check failed"),
          });
        }
      }

      const t = new $.cliffy.table.Table()
        .padding(4)
        .header(
          $.cliffy.table.Row.from(
            ["Name", "Installed Version", "Latest Version", "Check Skip Reason"].map($.colors.blue),
          ),
        )
        .body(
          checkResults
            .sort((l1, l2) => l1.name.localeCompare(l2.name))
            .map((cr) => {
              const current = cr.current ?? "-";
              const latest = cr.latest
                ? cr.outdated ? $.colors.green($.colors.bold(cr.latest)) : cr.latest
                : "-";
              const skip = cr.skip || "-";

              return $.cliffy.table.Row.from([cr.name, current, latest, skip]);
            }),
        );

      $.log("");
      $.log(t.toString());

      const outdatedResults = checkResults.filter((c) => (Boolean(c.outdated)));
      if (outdatedResults.length) {
        $.log($.dedent`

				Update all outdated apps at once with:

				${$.colors.magenta(`pam update ${outdatedResults.map((c) => `-a ${c.name}`).join(" ")}`)}

				`);
      }
    } else {
      $.logWarn(
        "warn:",
        "no candidates for outdated check were in scope; did you include any apps/groups?",
      );
    }
  });
