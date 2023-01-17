#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { type InstallerMeta, pamkit } from "../_cli/pamkit.ts";

const dotAppPath = $.path.join($.$dirname(import.meta.url), pamkit.constants.appArtifactsDir);
await $.fs.ensureDir(dotAppPath);

const ack = $.env.OS === "darwin" ? "ack" : "ack";
const curl = $.env.OS === "darwin" ? "curl" : "curl";
const direnv = $.env.OS === "darwin" ? "direnv" : "direnv";
const exiftool = $.env.OS === "darwin" ? "exiftool" : "libimage-exiftool-perl";
const fzf = $.env.OS === "darwin" ? "fzf" : "fzf";
const gnupg = $.env.OS === "darwin" ? "gnupg" : "gnupg";
const htop = $.env.OS === "darwin" ? "htop" : "htop";
const jq = $.env.OS === "darwin" ? "jq" : "jq";
const nano = $.env.OS === "darwin" ? "nano" : "nano";
const p7zip = $.env.OS === "darwin" ? "p7zip" : "p7zip-full";
const sqlite = $.env.OS === "darwin" ? "sqlite" : "sqlite3";
const tree = $.env.OS === "darwin" ? "tree" : "tree";
const vim = $.env.OS === "darwin" ? "vim" : "vim";
const w3m = $.env.OS === "darwin" ? "w3m" : "w3m";
const xz = $.env.OS === "darwin" ? "xz" : "xz-utils";

const list = [
  ack,
  curl,
  direnv,
  exiftool,
  fzf,
  gnupg,
  htop,
  jq,
  nano,
  p7zip,
  sqlite,
  tree,
  vim,
  w3m,
  xz,
];
if ($.env.OS === "darwin") {
  await $`brew install ${list}`.env({ HOMEBREW_NO_ANALYTICS: "1" });
} else {
  await $`sudo apt install -y ${list}`;
}

const meta: InstallerMeta = {
  name: $.$dirname(import.meta.url, true),
  path: $.$dirname(import.meta.url),
  type: "installed-managed",
  version: "",
  lastCheck: Date.now(),
};
const metaManifestPath = $.path.join(dotAppPath, pamkit.constants.metaManifestName);

await Deno.writeTextFile(metaManifestPath, JSON.stringify(meta, null, 2));
