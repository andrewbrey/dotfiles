type CFDNSRecord = { name: string; type: string; content: string };

Deno.serve(async (req) => {
	const url = new URL(req.url);

	switch (url.pathname) {
		/**
		 * route: dotfiles installer script
		 */
		case "/": {
			return new Response(await Deno.readTextFile("script.sh"), {
				headers: { "content-type": "text/plain;charset=UTF-8" },
			});
		}

		/**
		 * route: homelab host address
		 */
		case "/homelab-hosts": {
			try {
				const password = requireEnv("SECRET_HOMELAB_HOSTS_API_PASSWORD");
				const zoneId = requireEnv("SECRET_CF_BREY_FAMILY_ZONE_ID");
				const apiToken = requireEnv("SECRET_CF_BREY_FAMILY_DNS_READ_TOKEN");

				const providedPassword = req.headers.get("x-homelab-hosts-api-password")?.trim();

				invariant(password === providedPassword, "incorrect password");

				const { result: dnsRecords } = await fetch(
					`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
					{ headers: { "Authorization": `Bearer ${apiToken}` } },
				).then((r) => r.json() as unknown as { result: CFDNSRecord[] });

				const ip = dnsRecords?.find((r) => r.name === "brey.family" && r.type === "A")?.content;

				invariant(typeof ip === "string" && ip.length > 0, "missing required apex ip");

				const thirtyMin = 30 * 60;

				return new Response(ip, {
					status: 200,
					headers: {
						"content-type": "text/plain;charset=UTF-8",
						"cache-control":
							`max-age=${thirtyMin}, must-revalidate, s-maxage=${thirtyMin}, proxy-revalidate`,
					},
				});
			} catch (error) {
				return new Response(error instanceof Error ? error.message : "unauthorized", {
					status: 401,
					headers: { "content-type": "text/plain;charset=UTF-8" },
				});
			}
		}

		/**
		 * route: fallback
		 */
		default: {
			return new Response(":)", {
				status: 200,
				headers: { "content-type": "text/plain;charset=UTF-8" },
			});
		}
	}
});

function requireEnv(envName: string) {
	const value = Deno.env.get(envName)?.trim() ?? "";

	invariant(value.length > 0, `missing required env ${envName}`);

	return value;
}

function invariant(condition: any, message: string): asserts condition {
	if (condition) return;

	throw new Error(message);
}
