import yargs from "yargs";
import { hideBin } from "yargs/helpers";

await yargs(hideBin(process.argv))
  .scriptName("zeplin-cli")
  .usage("$0 <command> [options]")
  .command("hello", "world를 출력합니다", () => {
    console.log("world");
  })
  .demandCommand(1, "명령어를 지정해주세요")
  .strict()
  .help()
  .parseAsync();
