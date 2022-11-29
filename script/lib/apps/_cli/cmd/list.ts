import { colors, command, dateFns, table } from "../../../mod.ts";
import { calculateAppsInScope, getInstallerMetas } from "../meta.ts";

export const list = new command.Command()
  .description("List metadata about available apps.")
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
  .action(async ({ all, installed, uninstalled, app = [], group = [] }, ...args) => {
    const defaultListAll = (!installed && !uninstalled && !app.length && !group.length);

    const allMetas = await getInstallerMetas();
    const listable = await calculateAppsInScope({
      all: all || defaultListAll,
      installed: Boolean(installed),
      uninstalled: Boolean(uninstalled),
      apps: app,
      groups: group,
    });

    const t = new table.Table()
      .padding(4)
      .header(table.Row.from(["Name", "Installation Type", "Version", "Checked"].map(colors.blue)))
      .body(
        allMetas
          .filter((m) => listable.has(m.name))
          .sort((l1, l2) => l1.name.localeCompare(l2.name))
          .map((meta) => {
            const version = meta.version ?? "-";
            const checked = meta.updates?.manual
              ? dateFns.formatDistanceToNow(meta.updates.checked, { addSuffix: true })
              : "-";

            return table.Row.from([meta.name, meta.type, version, checked]);
          }),
      );

    console.log("");
    console.log(t.toString());
  });
