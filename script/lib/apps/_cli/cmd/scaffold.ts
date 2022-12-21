import { $, $dotdot, colors, command, handlebars, prompts, strCase } from "../../../mod.ts";
import { constants } from "../pamkit.ts";

export const scaffold = new command.Command()
  .description("Scaffold a new app from templates.")
  .arguments("[app_name:string]")
  .option("-a, --app <app_name:string>", "Name of the app to scaffold.")
  .action(async ({ app }, argAppName) => {
    let toScaffold = argAppName ?? app;
    toScaffold ??= await prompts.Input.prompt({
      message: "What is the name of the app you wish to scaffold?",
      validate: (provided) => {
        return provided.startsWith("_") ? "app name must not start with an underscore" : true;
      },
    });

    const kebabApp = strCase.kebab(toScaffold.replace(/^_/, "").trim());
    if (!kebabApp.length) {
      $.logError("error:", `no app name was supplied`);
      Deno.exit(1);
    }

    const newAppPath = $.path.join($dotdot(import.meta.url, 2), kebabApp);
    if ((await $.exists(newAppPath))) {
      $.logError("error:", `app named [${kebabApp}] already exists`);
      Deno.exit(1);
    }

    await $.fs.ensureDir(newAppPath);

    const templatesPath = $.path.join($dotdot(import.meta.url), "tmpl");
    const templates = ["install", "outdated", "remove", "update"];

    await Promise.all(templates.map((f) => {
      Deno.readTextFile($.path.join(templatesPath, `${f}.ts.hbs`))
        .then((rawTemplate) => {
          return handlebars.compile(rawTemplate);
        })
        .then((compiledTemplate) => {
          const writtenFilePath = $.path.join(newAppPath, `${f}.ts`);
          Deno.writeTextFile(writtenFilePath, compiledTemplate({}));

          return writtenFilePath;
        })
        .then((writtenFilePath) => {
          Deno.chmod(writtenFilePath, constants.executableMask);
        });
    }));

    $.logStep("success:", `new app has been scaffolded at ${colors.blue(newAppPath)}`);
  });
