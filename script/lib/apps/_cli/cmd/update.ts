import { $ } from "../../../mod.ts";
import { type InstallerMeta, pamkit } from "../pamkit.ts";

export const update = new $.cliffy.cmd.Command()
	.description("Update one or more available apps.")
	.arguments("[...app_names:string]")
	.option("--all", "Update all available apps.")
	.option(
		"-a, --app <app_name:string>",
		"Update one or more specific apps (repeatable).",
		{ collect: true },
	)
	.option(
		"-g, --group <app_group_name:string>",
		"Update the apps in one ore more specific app group (repeatable).",
		{ collect: true },
	)
	.option("--skip-confirm", "Automatically bypass confirmation prompts.")
	.action(async ({ all, app = [], group = [], skipConfirm }, ...argAppNames) => {
		const apps = [...argAppNames, ...app];
		const inScope = await pamkit.calculateAppsInScope({
			all: Boolean(all),
			installed: false,
			uninstalled: false,
			apps,
			groups: group,
		});

		const metasForScope = await pamkit.getInstallerMetas(inScope);
		const installedManual = metasForScope.filter((m) => m.type === "installed-manual");
		const uninstalledOrManaged = metasForScope.filter((m) => m.type !== "installed-manual");

		const lister = new Intl.ListFormat(undefined, { type: "conjunction", style: "short" });
		const toUpdateList = lister.format(installedManual.map((i) => $.colors.blue(i.name)));

		// =====
		// warn about skipped app names
		// =====
		const skipList = lister.format(uninstalledOrManaged.map((i) => $.colors.blue(i.name)));
		if (uninstalledOrManaged.length) {
			$.logWarn(
				"warn:",
				`skipping ${skipList} because ${
					uninstalledOrManaged.length > 1 ? "they are" : "it is"
				} not manually installed.`,
			);
		}

		if (installedManual.length) {
			const autoProceed = !$.env.STDIN_IS_TTY || Boolean(skipConfirm);

			if (autoProceed) {
				$.log(`About to update ${toUpdateList}.`);
				$.log("");
			}

			const proceed = !autoProceed
				? await $.confirm(`About to update ${toUpdateList}. Proceed?`, {
					default: true,
				})
				: true;

			if (!proceed) Deno.exit(1);

			const failedUpdates: InstallerMeta[] = [];
			for (const [idxStr, meta] of Object.entries(installedManual)) {
				const idx = parseInt(idxStr);
				const updateScript = $.path.join(meta.path, "update.ts");

				if (idx > 0) $.log("");
				$.log($.dedent`
					# ${$.colors.yellow("=====")}
					# Starting ${$.colors.blue(meta.name)} update (task ${
					idx + 1
				} of ${installedManual.length})
					# ${$.colors.yellow("=====")}
				`);
				$.log("");

				const startTime = Date.now();
				try {
					await $`zsh -c ${updateScript}`.printCommand(false);
				} catch (_error) {
					failedUpdates.push(meta);
				}

				$.log("");
				$.log($.dedent`
					# ${$.colors.green("=====")}
					# Done with ${$.colors.blue(meta.name)} update in about ${
					$.colors.magenta(
						$.dateFns.formatDistanceToNowStrict(startTime),
					)
				}
					# ${$.colors.green("=====")}
				`);
			}

			// =====
			// warn about failed app updates
			// =====
			const failList = lister.format(failedUpdates.map((i) => $.colors.blue(i.name)));
			if (failedUpdates.length) {
				$.log("");
				$.logError("error:", `app updates for ${failList} failed, see previous logs for details`);
			}
		} else {
			$.logWarn(
				"warn:",
				"no candidates for update were in scope; did you include any apps/groups?",
			);
		}
	});
