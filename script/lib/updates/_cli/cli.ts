#!/usr/bin/env -S deno run --allow-sys --unstable --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { $ } from "../../mod.ts";
import { dumkit } from "./dumkit.ts";

const dumoji = `${$.colors.yellow("⊂(◉‿◉)つ")}`;
const dum = `${$.colors.yellow("Dum")}`;

await new $.cliffy.cmd.Command()
	.name("dum")
	.version("1.0.0")
	.description(`${dumoji} -- {(Hello, I'm ${dum}, your daily updates manager)}`)
	.arguments("[...updater_group_names:string]")
	.option("--list", "List all available updaters and updater groups", {
		conflicts: ["updater", "group"],
	})
	.option(
		"-u, --updater <updater_name:string>",
		"Run one or more specific updaters (repeatable).",
		{ collect: true },
	)
	.option(
		"-g, --group <updater_group_name:string>",
		"Run one or more specific updater groups (repeatable).",
		{ collect: true },
	)
	.action(async ({ list, updater = [], group = [] }, ...argUpdaterGroups) => {
		if (list) {
			const allNames = Array.from(await dumkit.getUpdaterNames());
			const allGroups = dumkit.getGroups();

			$.log("");
			$.log($.colors.blue("Updaters"));
			$.logLight(allNames.sort().join(" "));

			$.log("");
			$.log($.colors.blue("Groups"));
			for (const [name, group] of allGroups) {
				$.log($.colors.bold(name));
				$.logLight(`  ${Array.from(group).join(", ")}`);
			}

			return;
		}

		const groups = [...argUpdaterGroups, ...group];

		if (!groups.length && !updater.length) groups.push("default"); // default to "default" group which may not include everything

		const inScope = Array.from(
			await dumkit.calculateUpdatersInScope({
				updaters: updater,
				groups,
			}),
		);

		const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
		const toUpdateList = lister.format(inScope.map((name) => $.colors.blue(name)));

		if (inScope.length) {
			$.log(`Running updates for ${toUpdateList}`);
			$.log("");

			for (const [idxStr, name] of Object.entries(inScope)) {
				const idx = parseInt(idxStr);
				const updateScript = $.path.join($.$dotdot(import.meta.url), name, "updater.ts");

				if (idx > 0) $.log("");
				$.log($.dedent`
					# ${$.colors.yellow("=====")}
					# Starting ${$.colors.blue(name)} update (task ${idx + 1} of ${inScope.length})
					# ${$.colors.yellow("=====")}
				`);
				$.log("");

				const startTime = Date.now();
				await $`zsh -c ${updateScript}`.printCommand(false);

				$.log("");
				$.log($.dedent`
					# ${$.colors.green("=====")}
					# Done with ${$.colors.blue(name)} update in about ${
					$.colors.magenta(
						$.dateFns.formatDistanceToNowStrict(startTime),
					)
				}
					# ${$.colors.green("=====")}
				`);
			}
		} else {
			$.logWarn(
				"warn:",
				"no candidates for update were in scope; did you include any updaters/groups?",
			);
		}
	})
	.parse(Deno.args);
