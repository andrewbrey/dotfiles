#!/usr/bin/env -S deno run --allow-sys --unstable -A

import { $, type FormatterFunction } from "../mod.ts";
import { etcHosts } from "./dns.ts";
import { keyFetchRequest } from "./keys.ts";
import { autoTZ } from "./tz.ts";

if ($.env.OS === "win32") Deno.exit(0);
if ($.env.IN_CONTAINER) Deno.exit(0);

try {
  const artifactsPath = $.path.join("/", "tmp", "dotsboot");
  const logfile = $.path.join(
    artifactsPath,
    `dots_${$.dateFns.format(new Date(), "yyyy-MM-dd")}.log`,
  );
  const formatter: FormatterFunction = (lr) => {
    return `${$.dateFns.formatISO(lr.datetime)} ${lr.levelName} ${lr.msg}`;
  };
  const divider = new Array(50).fill("-").join("");

  await $.fs.ensureDir(artifactsPath);

  $.logging.setup({
    handlers: {
      console: new $.logging.handlers.ConsoleHandler("NOTSET", { formatter }),
      file: new $.logging.handlers.FileHandler("NOTSET", { filename: logfile, formatter }),
    },
    loggers: { default: { level: "NOTSET", handlers: ["console", "file"] } },
  });

  const logger = $.logging.getLogger();
  logger.info(divider);

  const results = await Promise.allSettled([
    autoTZ(logger, artifactsPath),
    etcHosts(logger, artifactsPath),
    keyFetchRequest(logger, artifactsPath),
  ]);
  results.every((r) => r.status === "fulfilled") ? logger.info("all done :)") : logger.error(
    results.map((r) => {
      if (r.status === "fulfilled") return { status: "ok", msg: r.value };
      const msg = r.reason?.message ?? r.reason;
      return { status: "error", msg };
    }),
  );
} catch (bootErr) {
  try {
    $.logging.error(bootErr);
  } catch (logErr) {
    console.error(bootErr);
  }
}
