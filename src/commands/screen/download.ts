import type { CommandModule, ArgumentsCamelCase } from "yargs";
import { resolve } from "node:path";
import { zeplinClient } from "../../zeplin.ts";
import { parseZeplinScreenUrl } from "../../parse-url.ts";
import { isApiError, getApiErrorMessage } from "../../api-error.ts";
import { classifyAndSelectAssets } from "../../asset-classifier.ts";
import { downloadAllAssets } from "../../asset-downloader.ts";

type ScreenDownloadArgs = {
  url: string;
  output: string;
};

const screenDownloadCommand: CommandModule<object, ScreenDownloadArgs> = {
  command: "download <url>",
  describe: "스크린의 에셋을 다운로드합니다",
  builder: (yargs) =>
    yargs
      .positional("url", {
        type: "string",
        describe: "Zeplin 스크린 URL",
        demandOption: true,
      })
      .option("output", {
        alias: "o",
        type: "string",
        describe: "저장할 디렉터리 경로",
        default: "./assets",
      }),
  handler: async (args: ArgumentsCamelCase<ScreenDownloadArgs>) => {
    const { projectId, screenId } = parseZeplinScreenUrl(args.url);
    const outputDir = resolve(args.output);

    try {
      console.log("스크린 정보를 조회하고 있습니다...");

      const versionResponse = await zeplinClient.screens.getLatestScreenVersion(
        projectId,
        screenId,
      );
      const { assets } = versionResponse.data;

      if (assets.length === 0) {
        console.log("다운로드할 에셋이 없습니다.");
        return;
      }

      console.log(`에셋 ${String(assets.length)}개를 분류하고 있습니다...`);
      const classifiedAssets = await classifyAndSelectAssets(assets);

      if (classifiedAssets.length === 0) {
        console.log("다운로드 가능한 에셋이 없습니다.");
        return;
      }

      console.log(
        `\n${String(classifiedAssets.length)}개 에셋을 다운로드합니다 → ${outputDir}\n`,
      );
      const result = await downloadAllAssets(classifiedAssets, outputDir);

      console.log("\n=== 다운로드 완료 ===");
      console.log(`성공: ${String(result.success.length)}개`);
      if (result.failed.length > 0) {
        console.log(`실패: ${String(result.failed.length)}개`);
      }
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

export { screenDownloadCommand };
