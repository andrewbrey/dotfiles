import { $ } from "../../mod.ts";

const msg = console.error; // output of script is read from stdout, so do logging with `msg`
const extractProfiles = (text: string) =>
  Array.from(
    new Set(
      text.split(/\r?\n/g)
        .filter((l) => l.match(/\[\w+\]/))
        .filter((l) => !l.includes("default"))
        .map((l) => l.replaceAll("[", "").replaceAll("]", ""))
        .map((l) => l.trim()).filter(Boolean),
    ),
  ).sort();

try {
  const configDir = $.path.join($.env.STANDARD_DIRS.DOT_DOTS_APPS, "awscli", ".aws");
  const configPath = $.path.join(configDir, "config");
  const credsPath = $.path.join(configDir, "credentials");

  await $.requireExists(configPath);
  await $.requireExists(credsPath);

  const [config, creds] = await Promise.all([
    Deno.readTextFile(configPath),
    Deno.readTextFile(credsPath),
  ]);

  const configProfiles = extractProfiles(config);
  const credsProfiles = extractProfiles(creds);

  const profiles = $.collections.intersect(configProfiles, credsProfiles);
  const chosenIdx = await $.maybeSelect({ message: "Choose a profile...", options: profiles });
  const chosen = (typeof chosenIdx !== "undefined") ? profiles[chosenIdx] : "";

  if (chosen) console.log(chosen);
} catch (error) {
  msg(error);
}
