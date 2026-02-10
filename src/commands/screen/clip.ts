import type { Layer, ScreenVersion } from "@zeplin/sdk";
import type { CommandModule, ArgumentsCamelCase } from "yargs";
import { createInterface } from "readline";
import { execSync } from "child_process";
import { zeplinClient } from "../../zeplin.ts";
import { parseZeplinScreenUrl } from "../../parse-url.ts";
import { isApiError, getApiErrorMessage } from "../../api-error.ts";
import {
  printLayerDetail,
  printLayerTree,
  type OutputWriter,
} from "../../formatters/layer.ts";

type ScreenClipArgs = {
  url: string;
};

function getDepth1Layers(version: ScreenVersion): Array<Layer> {
  const rootLayer = version.layers[0];
  if (!rootLayer?.layers) {
    return [];
  }
  return rootLayer.layers;
}

function formatLayerSubtree(layer: Layer): string {
  const lines: Array<string> = [];
  const writer: OutputWriter = (message: string) => {
    lines.push(message);
  };

  const componentLabel = layer.componentName
    ? ` (컴포넌트: ${layer.componentName})`
    : "";
  writer(
    `[${layer.type}] ${layer.name ?? "(이름 없음)"}${componentLabel}`,
  );

  printLayerDetail(layer, "  ", writer);

  if (layer.layers && layer.layers.length > 0) {
    printLayerTree(layer.layers, "  ", 1, writer);
  }

  return lines.join("\n");
}

function copyToClipboard(text: string): void {
  execSync("pbcopy", { input: text });
}

function runInteractiveClipLoop(
  depth1Layers: Array<Layer>,
  rootLayerName: string,
): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n=== ${rootLayerName} — depth1 섹션 목록 ===`);
    depth1Layers.forEach((layer, index) => {
      const componentLabel = layer.componentName
        ? ` (컴포넌트: ${layer.componentName})`
        : "";
      console.log(
        `  [${String(index + 1)}] [${layer.type}] ${layer.name ?? "(이름 없음)"}${componentLabel}`,
      );
    });
    console.log(`  [0] 종료`);

    const promptUser = (): void => {
      rl.question("\n복사할 섹션 번호를 입력하세요: ", (answer: string) => {
        const num = Number(answer.trim());

        if (num === 0) {
          rl.close();
          resolve();
          return;
        }

        if (Number.isNaN(num) || num < 1 || num > depth1Layers.length) {
          console.log(
            `1~${String(depth1Layers.length)} 사이의 번호 또는 0(종료)을 입력하세요.`,
          );
          promptUser();
          return;
        }

        const selectedLayer = depth1Layers[num - 1];
        if (!selectedLayer) {
          promptUser();
          return;
        }
        const formatted = formatLayerSubtree(selectedLayer);

        try {
          copyToClipboard(formatted);
          console.log(
            `"${selectedLayer.name ?? "(이름 없음)"}" 섹션이 클립보드에 복사되었습니다.`,
          );
        } catch {
          console.error("클립보드 복사에 실패했습니다.");
        }

        promptUser();
      });
    };

    promptUser();
  });
}

const screenClipCommand: CommandModule<object, ScreenClipArgs> = {
  command: "clip <url>",
  describe: "depth1 섹션을 선택하여 클립보드에 복사합니다",
  builder: (yargs) =>
    yargs.positional("url", {
      type: "string",
      describe: "Zeplin 스크린 URL",
      demandOption: true,
    }),
  handler: async (args: ArgumentsCamelCase<ScreenClipArgs>) => {
    const { projectId, screenId } = parseZeplinScreenUrl(args.url);

    try {
      const versionResponse =
        await zeplinClient.screens.getLatestScreenVersion(
          projectId,
          screenId,
        );
      const version: ScreenVersion = versionResponse.data;

      const rootLayer = version.layers[0];
      if (!rootLayer) {
        console.log("루트 레이어가 없습니다.");
        return;
      }

      const depth1Layers = getDepth1Layers(version);

      if (depth1Layers.length === 0) {
        console.log("depth1 레이어가 없습니다.");
        return;
      }

      const rootLayerName = rootLayer.name ?? "(이름 없음)";
      await runInteractiveClipLoop(depth1Layers, rootLayerName);
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

export { screenClipCommand };
