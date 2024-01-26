#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";

// Allow passwordless edit of /etc/hosts file
// @see https://askubuntu.com/a/895649
// @see https://superuser.com/a/869145

const sudoersDir = "/etc/sudoers.d";
const sudoersEntry = $.path.join(sudoersDir, "hostsfile");

if (await $.missing(sudoersEntry)) {
	await $.requireExists(sudoersDir);

	const homelabHostsScript = $.path.join(
		$.env.STANDARD_DIRS.DOT_DOTS_SETTINGS,
		"hostsfile",
		".homelab-hosts.sh",
	);

	await $.raw`sudo tee ${sudoersEntry}`.stdinText(
		$.dedent`
			${$.env.USER} ALL = (root) NOPASSWD: sudoedit /etc/hosts
			${$.env.USER} ALL = (root) NOPASSWD: ${$.path.join(homelabHostsScript)}

		`,
	);

	await $`sudo chmod 0440 ${sudoersEntry}`;
}
