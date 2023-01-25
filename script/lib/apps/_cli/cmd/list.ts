import { $ } from "../../../mod.ts";
import { pamkit } from "../pamkit.ts";

export const list = new $.cliffy.cmd.Command()
  .description("List metadata about available apps.")
  .alias("ls")
  .arguments("[...app_names:string]")
  .option("--all", "List metadata for all available apps, both installed and uninstalled.")
  .option("-i, --installed", "List metadata for installed apps.")
  .option("-u, --uninstalled", "List metadata for uninstalled apps.")
  .option(
    "-a, --app <app_name:string>",
    "List metadata for one or more specific apps (repeatable).",
    { collect: true },
  )
  .option(
    "-g, --group <app_group_name:string>",
    "List metadata for one or more specific app groups (repeatable).",
    { collect: true },
  )
  .action(async ({ all, installed, uninstalled, app = [], group = [] }, ...argAppNames) => {
    const apps = [...argAppNames, ...app];
    const defaultListAll = !installed && !uninstalled && !apps.length && !group.length;

    const allMetas = await pamkit.getInstallerMetas();
    const inScope = await pamkit.calculateAppsInScope({
      all: all || defaultListAll,
      installed: Boolean(installed),
      uninstalled: Boolean(uninstalled),
      apps,
      groups: group,
    });

    const t = new $.cliffy.table.Table()
      .padding(4)
      .header(
        $.cliffy.table.Row.from(
          ["Name", "Installation Type", "Version", "Checked"].map($.colors.blue),
        ),
      )
      .body(
        allMetas
          .filter((m) => inScope.has(m.name))
          .sort((l1, l2) => l1.name.localeCompare(l2.name))
          .map((meta) => {
            const version = meta.version ?? "-";
            const checked = meta.lastCheck
              ? $.dateFns.formatDistanceToNow(meta.lastCheck, { addSuffix: true })
              : "-";

            return $.cliffy.table.Row.from([meta.name, meta.type, version, checked]);
          }),
      );

    $.log("");
    $.log(t.toString());

    if (defaultListAll) {
      $.log("");
      $.log($.colors.blue("Groups"));

      for (const [name, group] of pamkit.getGroups()) {
        $.log($.colors.bold(name));
        $.logLight(`  ${Array.from(group).join(", ")}`);
      }
    }
  });
