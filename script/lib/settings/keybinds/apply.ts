#!/usr/bin/env -S deno run --allow-env --allow-net=deno.land --allow-read --allow-write --allow-run

import { getChezmoiData, osInvariant } from "../../mod.ts";

osInvariant();

const chezmoiData = await getChezmoiData();

console.log(chezmoiData);
