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
      DOT_DOTS: $.path.join(env.HOME, ".dots"),
      DOT_DOTS_APPS: $.path.join(env.HOME, ".dots", "apps"),
      DOT_DOTS_SETTINGS: $.path.join(env.HOME, ".dots", "settings"),
      LOCAL_BIN: $.path.join(env.HOME, ".local", "bin"),
      LOCAL_SHARE_APPS: $.path.join(env.HOME, ".local", "share", "applications"),
    };
  },
};

/** Useful subset of the data available when running `chezmoi data` */
export type ChezmoiData = {
  chezmoi: {
    arch: string;
    fqdnHostname: string;
    hostname: string;
    kernel: { osrelease: string; ostype: string; version: string };
    os: string;
    osRelease: {
      id: string;
      idLike: string;
      name: string;
      prettyName: string;
      version: string;
      versionCodename: string;
      versionID: string;
    };
  };
  is_cloud: boolean;
  is_codespaces: boolean;
  is_containerized: boolean;
  is_gitpod: boolean;
  is_linux: boolean;
  is_mac: boolean;
  is_personal_machine: boolean;
  is_popos: boolean;
  is_remote_container: boolean;
  is_ubuntu: boolean;
  standard_dirs: {
    code: string;
    npm_install: string;
    pnpm_install: string;
    dot_dots: string;
    dot_dots_apps: string;
    local_bin: string;
    local_share_apps: string;
  };
};

export async function getChezmoiData() {
  const dataReady = await $.exists($.path.join(env.HOME, ".config", "chezmoi", "chezmoi.yaml"));

  if (!dataReady) throw new Error("unable to read chezmoi data before it is created");

  return await $`chezmoi data`.printCommand(false).json() as ChezmoiData;
}
