import { env } from "./env.ts";
import { invariant, osInvariant } from "./util.ts";

export { stdColors as colors } from "./deps.ts";
export { $, env } from "./env.ts";
export { blackOnYellow, doneWith } from "./fmt.ts";
export { inspect, invariant, osInvariant } from "./util.ts";

// sanity-check / safeguards
osInvariant();
invariant(env.USER.trim().length > 0, "missing required env variable $USER");
invariant(env.HOME.trim().length > 0, "missing required env variable $HOME");
