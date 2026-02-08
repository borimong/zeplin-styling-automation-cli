import type { CommandModule, ArgumentsCamelCase } from "yargs";
import { zeplinClient } from "../../zeplin.ts";

type ScreenListArgs = {
  projectId: string;
  limit: number | undefined;
  offset: number | undefined;
};

const screenListCommand: CommandModule<object, ScreenListArgs> = {
  command: "list",
  describe: "프로젝트의 스크린 목록을 조회합니다",
  builder: (yargs) =>
    yargs
      .option("projectId", {
        alias: "p",
        type: "string",
        demandOption: true,
        describe: "프로젝트 ID",
      })
      .option("limit", {
        alias: "l",
        type: "number",
        describe: "조회할 최대 개수",
      })
      .option("offset", {
        type: "number",
        describe: "페이지네이션 오프셋",
      }),
  handler: async (args: ArgumentsCamelCase<ScreenListArgs>) => {
    const params: { limit?: number; offset?: number } = {};
    if (args.limit !== undefined) params.limit = args.limit;
    if (args.offset !== undefined) params.offset = args.offset;

    const response = await zeplinClient.screens.getProjectScreens(
      args.projectId,
      params,
    );
    console.log(JSON.stringify(response.data, null, 2));
  },
};

export { screenListCommand };
