#!/usr/bin/env -S deno run -A

import { $, dateFns, env, log } from "../mod.ts";
import { autoTZ } from "./tz.ts";

if (env.OS === "win32") Deno.exit(0);

try {
  const artifactsPath = $.path.join("/", "tmp", "dotsboot");
  const logfile = $.path.join(
    artifactsPath,
    `dots_${dateFns.format(new Date(), "yyyy-MM-dd")}.log`,
  );
  const formatter: log.FormatterFunction = (lr) => {
    return `${dateFns.formatISO(lr.datetime)} ${lr.levelName} ${lr.msg}`;
  };
  const divider = new Array(50).fill("-").join("");

  await $.fs.ensureDir(artifactsPath);

  log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("NOTSET", { formatter }),
      file: new log.handlers.FileHandler("NOTSET", { filename: logfile, formatter }),
    },
    loggers: { default: { level: "NOTSET", handlers: ["console", "file"] } },
  });

  const logger = log.getLogger();
  logger.info(divider);

  await Promise.allSettled([autoTZ(logger)]).then(() => logger.info("all done :)")).catch((e) =>
    logger.error(e)
  );
} catch (bootErr) {
  console.error(bootErr);
}
