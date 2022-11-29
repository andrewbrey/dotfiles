import { boldRed, colors, command, dateFns, table } from "../../../mod.ts";
import { getGroups, getInstallerMetas } from "../meta.ts";

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
    const allNames = allMetas.map((m) => m.name);
    const listable: Set<string> = new Set();

    if (all || defaultListAll) {
      allNames.forEach((m) => listable.add(m));
    }

    if (installed) {
      allMetas.filter((m) => m.type !== "uninstalled").forEach((m) => listable.add(m.name));
    }

    if (uninstalled) {
      allMetas.filter((m) => m.type === "uninstalled").forEach((m) => listable.add(m.name));
    }

    const badDashA = new Set<string>();
    for (const name of app) {
      if (allNames.includes(name)) {
        listable.add(name);
      } else {
        badDashA.add(name);
      }
    }

    const groups = getGroups();
    const badDashG = new Set<string>();
    for (const name of group) {
      const foundGroup = groups.get(name);

      if (foundGroup) {
        foundGroup.forEach((n) => {
          if (allNames.includes(n)) {
            listable.add(n);
          } else {
            console.error(
              boldRed("error:"),
              `group called ${colors.blue(name)} contains unknown app ${colors.yellow(n)}`,
            );
          }
        });
      } else {
        badDashG.add(name);
      }
    }

    badDashA.forEach((b) =>
      console.error(
        boldRed("error:"),
        `unknown --app named ${colors.yellow(b)} `,
      )
    );

    badDashG.forEach((b) =>
      console.error(
        boldRed("error:"),
        `unknown --group named ${colors.yellow(b)} `,
      )
    );

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
