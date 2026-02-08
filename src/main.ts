#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync } from "node:fs";

const envPath = resolve(import.meta.dirname, "..", ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const { default: yargs } = await import("yargs");
const { hideBin } = await import("yargs/helpers");
const { screenCommand } = await import("./commands/screen/index.ts");

await yargs(hideBin(process.argv))
  .scriptName("zeplin-cli")
  .usage("$0 <command> [options]")
  .command(screenCommand)
  .demandCommand(1, "명령어를 지정해주세요")
  .strict()
  .help()
  .parseAsync();
