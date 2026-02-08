#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync } from "node:fs";

const envPath = resolve(import.meta.dirname, "..", ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const { default: yargs } = await import("yargs");
const { hideBin } = await import("yargs/helpers");
const { screenCommand } = await import("./commands/screen.ts");

await yargs(hideBin(process.argv))
  .scriptName("zeplin-cli")
  .usage("$0 <command> [options]")
  .command("hello", "world를 출력합니다", () => {
    console.log("world");
  })
  .command(
    "screen <url>",
    "Zeplin 스크린 정보를 조회합니다",
    (yargs) =>
      yargs.positional("url", {
        type: "string",
        describe: "Zeplin 스크린 URL",
        demandOption: true,
      }),
    async (argv) => {
      await screenCommand(argv.url);
    },
  )
  .demandCommand(1, "명령어를 지정해주세요")
  .strict()
  .help()
  .parseAsync();
