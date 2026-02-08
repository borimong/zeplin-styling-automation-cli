import type { CommandModule } from "yargs";
import { screenGetCommand } from "./get.ts";
import { screenListCommand } from "./list.ts";

const screenCommand: CommandModule<object, object> = {
  command: "screen",
  describe: "스크린을 관리합니다",
  builder: (yargs) =>
    yargs
      .command(screenGetCommand)
      .command(screenListCommand)
      .demandCommand(1, "하위 명령어를 지정해주세요"),
  handler: () => {},
};

export { screenCommand };
