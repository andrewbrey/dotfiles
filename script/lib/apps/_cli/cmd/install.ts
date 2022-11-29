import { command } from "../../../mod.ts";
import { calculateAppsInScope } from "../meta.ts";

export const install = new command.Command()
  .description("Install one or more available apps.")
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
  .action(async ({ all, app = [], group = [] }, ...args) => {
    const installable = await calculateAppsInScope({
      all: Boolean(all),
      installed: false,
      uninstalled: false,
      apps: app,
      groups: group,
    });

    console.log({ all, app, group, installable });
  });
