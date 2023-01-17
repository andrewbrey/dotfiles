import { $ } from "../../mod.ts";

const constants = {
  updaterMemoDir: ".memo",
};

function getGroups() {
  const groups: Map<string, Set<string>> = new Map();

  // NOTE: if update order matters, make sure to list
  // prerequisites earlier in the updater name array

  // NOTE: "default" group is treated as a default if
  // no other updaters / groups are specified - try to
  // keep it up to date with desired defaults
  groups.set(
    "default",
    new Set<string>([
      "package-manager",
      "deno",
      "npm-globals",
      "gnome-shell-extensions",
      "cheatsheets",
      "completions",
      "zgenom",
      "dotfiles",
    ]),
  );
  groups.set("core", new Set<string>(["package-manager", "deno", "npm-globals", "dotfiles"]));

  return groups;
}

async function getUpdaterNames() {
  const updatersDir = $.$dotdot(import.meta.url);
  const updaterNames: Set<string> = new Set();

  for await (const entry of Deno.readDir(updatersDir)) {
    if (entry.isDirectory && !entry.name.startsWith("_")) updaterNames.add(entry.name);
  }

  return updaterNames;
}

/**
 * Determine all updaters that should be included.
 *
 * Note that if there are dependencies/prerequisites for some
 * updaters, you need to manually ensure that prerequisites
 * are in place, perhaps by running your dum commands in
 * stages (or using updater groups which can specify order)
 */
async function calculateUpdatersInScope(
  opts: {
    /** Included updater names */
    updaters: string[];
    /** Included updater group names */
    groups: string[];
  },
) {
  const inScope: Set<string> = new Set();

  const allNames = await getUpdaterNames();
  const updaterGroups = getGroups();

  // =====
  // handle updaters by name
  // =====
  const unknownUpdaterNames = new Set<string>();
  for (const name of opts.updaters) {
    if (allNames.has(name)) {
      inScope.add(name);
    } else {
      unknownUpdaterNames.add(name);
    }
  }

  // =====
  // handle updaters by group
  // =====
  const unknownUpdaterGroups = new Set<string>();
  for (const name of opts.groups) {
    const foundGroup = updaterGroups.get(name);

    if (foundGroup) {
      foundGroup.forEach((n) => {
        if (allNames.has(n)) {
          inScope.add(n);
        } else {
          // =====
          // warn about bad updaters within known groups
          // =====
          $.logError(
            "error:",
            `group called ${$.colors.blue(name)} contains unknown updater ${$.colors.yellow(n)}`,
          );
        }
      });
    } else {
      unknownUpdaterGroups.add(name);
    }
  }

  // =====
  // warn about unknown updater names
  // =====
  unknownUpdaterNames.forEach((a) =>
    $.logError("error:", `unknown --updater named ${$.colors.yellow(a)} `)
  );

  // =====
  // warn about unknown updater groups
  // =====
  unknownUpdaterGroups.forEach((g) =>
    $.logError("error:", `unknown --group named ${$.colors.yellow(g)} `)
  );

  return inScope;
}

export const dumkit = {
  calculateUpdatersInScope,
  constants,
  getGroups,
  getUpdaterNames,
} as const;
