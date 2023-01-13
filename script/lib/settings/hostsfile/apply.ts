#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $, invariant } from "../../mod.ts";

// Allow passwordless edit of /etc/hosts file
// @see https://askubuntu.com/a/895649
// @see https://superuser.com/a/869145

const sudoersDir = "/etc/sudoers.d";
const sudoersEntry = $.path.join(sudoersDir, "hostsfile");

if (await $.missing(sudoersEntry)) {
  invariant(await $.exists(sudoersDir), `missing required directory ${sudoersDir}`);

  await $.raw`sudo tee ${sudoersEntry}`.stdin(
    $.strings.asBytes(`${$.env.USER} ALL = (root) NOPASSWD: sudoedit /etc/hosts\n`),
  );

  await $`sudo chmod 0440 ${sudoersEntry}`;
}
