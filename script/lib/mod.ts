import * as stdColors from "https://deno.land/std@0.165.0/fmt/colors.ts";
import { EOL, platform } from "https://deno.land/std@0.165.0/node/os.ts";
import { inspect as stdInspect } from "https://deno.land/std@0.165.0/node/util.ts";
import { $ as dax$ } from "https://deno.land/x/dax@0.15.0/mod.ts";

export const $ = dax$.build$();
$.setPrintCommand(true);

export const env = {
  CODESPACES: Deno.env.get("CODESPACES") === "true",
  REMOTE_CONTAINERS: Deno.env.get("REMOTE_CONTAINERS") === "true",
  GITPOD: Boolean(Deno.env.get("GITPOD_WORKSPACE_ID")),
  get IN_CLOUD_IDE() {
    return env.CODESPACES || env.GITPOD;
  },
  get IN_CONTAINER() {
    return env.CODESPACES || env.GITPOD || env.REMOTE_CONTAINERS;
  },
  OS: platform() as "darwin" | "linux" | "win32",
  USER: Deno.env.get("USER") ?? "",
  HOME: Deno.env.get("HOME") ?? "",
  STDIN_IS_TTY: Deno.isatty(Deno.stdin.rid),
  ALLOW_COLOR: !Deno.noColor,
  EOL,
  get STANDARD_DIRS() {
    return {
      CODE: $.path.join(env.HOME, "code"),
      NPM_INSTALL: $.path.join(env.HOME, ".npm-globals"),
    };
  },
};

export const colors = stdColors;
export const blackOnYellow = (what: string) => colors.black(colors.bgYellow(what));

export function inspect(what: any, depth: number = Infinity) {
  return stdInspect(what, { colors: env.ALLOW_COLOR, depth, getters: true });
}

export function doneWith(id: string) {
  $.logStep("done with", id, env.EOL);
}

export function invariant(condition: any, message?: string): asserts condition {
  if (condition) return;

  const prefix = "Invariant failed";
  const value: string = message ? `${prefix}: ${message}` : prefix;
  throw new Error(value);
}

export function osInvariant() {
  invariant(
    ["linux", "darwin"].includes(env.OS),
    `unknown or unsupported operating system [${env.OS}]`,
  );
}

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
