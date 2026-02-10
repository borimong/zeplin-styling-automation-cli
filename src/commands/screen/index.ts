import type { CommandModule } from "yargs";
import { screenGetCommand } from "./get.ts";
import { screenListCommand } from "./list.ts";
import { screenDownloadCommand } from "./download.ts";
import { screenGetSectionByAnnotationCommand } from "./getSectionByAnnotation.ts";
import { screenClipCommand } from "./clip.ts";
import { screenSpecCommand } from "./spec.ts";

const screenCommand: CommandModule<object, object> = {
  command: "screen",
  describe: "스크린을 관리합니다",
  builder: (yargs) =>
    yargs
      .command(screenGetCommand)
      .command(screenListCommand)
      .command(screenDownloadCommand)
      .command(screenGetSectionByAnnotationCommand)
      .command(screenClipCommand)
      .command(screenSpecCommand)
      .demandCommand(1, "하위 명령어를 지정해주세요"),
  handler: () => {},
};

export { screenCommand };
