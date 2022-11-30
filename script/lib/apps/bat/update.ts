#!/usr/bin/env -S deno run --allow-env --allow-net=example.com --allow-read --allow-write --allow-run

import { osInvariant } from "../../mod.ts";

osInvariant();
