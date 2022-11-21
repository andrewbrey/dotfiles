import { dax, stdNodeOS } from "./deps.ts";

export const $ = dax.build$();
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
  OS: stdNodeOS.platform() as "darwin" | "linux" | "win32",
  USER: Deno.env.get("USER") ?? "",
  HOME: Deno.env.get("HOME") ?? "",
  STDIN_IS_TTY: Deno.isatty(Deno.stdin.rid),
  ALLOW_COLOR: !Deno.noColor,
  EOL: stdNodeOS.EOL,
  get STANDARD_DIRS() {
    return {
      CODE: $.path.join(env.HOME, "code"),
      NPM_INSTALL: $.path.join(env.HOME, ".npm-globals"),
      PNPM_INSTALL: $.path.join(env.HOME, ".pnpm-globals"),
    };
  },
};
