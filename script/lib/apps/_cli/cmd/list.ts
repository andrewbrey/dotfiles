import { command } from "../../../mod.ts";
import { getInstallerMetas } from "../meta.ts";

export const list = new command.Command()
  .description("List metadata about available apps.")
  .option("--all", "List metadata for all available apps, both installed and uninstalled.")
  .option("-i, --installed", "List metadata for installed apps.")
  .option("-u, --uninstalled", "List metadata for uninstalled apps.")
  .option("-a, --app <app_name:string>", "List metadata for one or more specific apps.", {
    collect: true,
  })
  .option(
    "-g, --group <app_group_name:string>",
    "List metadata for one or more specific app groups.",
    { collect: true },
  )
  .action(async ({ all, installed, uninstalled, app, group }, ...args) => {
    const metas = await getInstallerMetas();

    console.log({ all, installed, uninstalled, app, group, metas });
  });
