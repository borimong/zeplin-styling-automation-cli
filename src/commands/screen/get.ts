import type { Screen, ScreenVersion } from "@zeplin/sdk";
import type { CommandModule, ArgumentsCamelCase } from "yargs";
import { zeplinClient } from "../../zeplin.ts";
import { parseZeplinScreenUrl } from "../../parse-url.ts";
import { isApiError, getApiErrorMessage } from "../../api-error.ts";
import {
  formatColor,
  printAssets,
  printLayerTree,
  printLinks,
} from "../../formatters/layer.ts";

type ScreenGetArgs = {
  url: string;
};

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("ko-KR");
}

function printScreenInfo(screen: Screen): void {
  console.log("=== 스크린 기본 정보 ===");
  console.log(`이름: ${screen.name}`);
  console.log(`설명: ${screen.description ?? "(없음)"}`);
  console.log(`ID: ${screen.id}`);
  console.log(
    `태그: ${screen.tags.length > 0 ? screen.tags.join(", ") : "(없음)"}`,
  );
  console.log(`섹션: ${screen.section?.id ?? "(없음)"}`);
  console.log(`생성일: ${formatDate(screen.created)}`);
  console.log(
    `수정일: ${screen.updated ? formatDate(screen.updated) : "(없음)"}`,
  );
}

function printVersionInfo(version: ScreenVersion): void {
  console.log("\n=== 최신 버전 정보 ===");
  console.log(`크기: ${String(version.width)} x ${String(version.height)}`);
  console.log(`배율: ${String(version.densityScale)}x`);
  console.log(
    `배경색: ${version.backgroundColor ? formatColor(version.backgroundColor) : "(없음)"}`,
  );
  console.log(`레이어 수: ${String(version.layers.length)}`);
  console.log(`에셋 수: ${String(version.assets.length)}`);
  console.log(`링크 수: ${String(version.links.length)}`);
}

function printStats(screen: Screen): void {
  console.log("\n=== 통계 ===");
  console.log(`노트 수: ${String(screen.numberOfNotes)}`);
  console.log(`어노테이션 수: ${String(screen.numberOfAnnotations)}`);
  console.log(`버전 수: ${String(screen.numberOfVersions)}`);
}

const screenGetCommand: CommandModule<object, ScreenGetArgs> = {
  command: "get <url>",
  describe: "Zeplin 스크린 상세 정보를 조회합니다",
  builder: (yargs) =>
    yargs.positional("url", {
      type: "string",
      describe: "Zeplin 스크린 URL",
      demandOption: true,
    }),
  handler: async (args: ArgumentsCamelCase<ScreenGetArgs>) => {
    const { projectId, screenId } = parseZeplinScreenUrl(args.url);

    try {
      const [screenResponse, versionResponse] = await Promise.all([
        zeplinClient.screens.getScreen(projectId, screenId),
        zeplinClient.screens.getLatestScreenVersion(projectId, screenId),
      ]);

      const screen: Screen = screenResponse.data;
      const version: ScreenVersion = versionResponse.data;

      printScreenInfo(screen);
      printVersionInfo(version);
      printStats(screen);

      if (version.layers.length > 0) {
        console.log("\n=== 레이어 상세 ===");
        printLayerTree(version.layers, "", 0);
      }
      printAssets(version.assets);
      printLinks(version.links);
    } catch (error: unknown) {
      if (isApiError(error)) {
        console.error(getApiErrorMessage(error.response.status));
      } else if (error instanceof Error) {
        console.error(`오류가 발생했습니다: ${error.message}`);
      } else {
        console.error("알 수 없는 오류가 발생했습니다.");
      }
      process.exit(1);
    }
  },
};

export { screenGetCommand };
