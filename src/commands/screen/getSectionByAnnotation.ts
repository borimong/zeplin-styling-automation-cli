import type {
  BoundingRectangle,
  Layer,
  ScreenAnnotation,
  ScreenAnnotationPosition,
} from "@zeplin/sdk";
import type { CommandModule, ArgumentsCamelCase } from "yargs";
import { zeplinClient } from "../../zeplin.ts";
import { parseZeplinScreenUrl } from "../../parse-url.ts";
import { isApiError, getApiErrorMessage } from "../../api-error.ts";
import { printLayerDetail } from "../../formatters/layer.ts";

type ScreenGetSectionByAnnotationArgs = {
  url: string;
  text: string;
};

interface PixelCoordinate {
  x: number;
  y: number;
}

interface AnnotationMatch {
  annotation: ScreenAnnotation;
  pixelCoordinate: PixelCoordinate;
  rootLayer: Layer | undefined;
}

function filterAnnotationsByText(
  annotations: Array<ScreenAnnotation>,
  searchText: string,
): Array<ScreenAnnotation> {
  const lowerSearchText = searchText.toLowerCase();
  return annotations.filter((annotation) =>
    annotation.content.toLowerCase().includes(lowerSearchText),
  );
}

function toPixelCoordinate(
  position: ScreenAnnotationPosition,
  screenWidth: number,
  screenHeight: number,
): PixelCoordinate {
  return {
    x: Math.round(position.x * screenWidth),
    y: Math.round(position.y * screenHeight),
  };
}

function isPointInsideRect(
  point: PixelCoordinate,
  rect: BoundingRectangle,
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function findRootLayerAtPoint(
  rootLayers: Array<Layer>,
  point: PixelCoordinate,
): Layer | undefined {
  return rootLayers.find((layer) => isPointInsideRect(point, layer.rect));
}

function printAnnotationMatch(match: AnnotationMatch, index: number): void {
  console.log(`\n--- 어노테이션 #${String(index + 1)} ---`);
  console.log(`내용: "${match.annotation.content}"`);
  console.log(`유형: ${match.annotation.type.name}`);
  console.log(
    `위치 (정규화): (${String(match.annotation.position.x)}, ${String(match.annotation.position.y)})`,
  );
  console.log(
    `위치 (픽셀): (${String(match.pixelCoordinate.x)}, ${String(match.pixelCoordinate.y)})`,
  );

  if (match.rootLayer) {
    const componentLabel = match.rootLayer.componentName
      ? ` (컴포넌트: ${match.rootLayer.componentName})`
      : "";
    console.log(`\n매칭된 루트 레이어:`);
    console.log(
      `  [${match.rootLayer.type}] ${match.rootLayer.name ?? "(이름 없음)"}${componentLabel}`,
    );
    printLayerDetail(match.rootLayer, "  ");
  } else {
    console.log(`\n매칭된 루트 레이어: (없음)`);
  }
}

const screenGetSectionByAnnotationCommand: CommandModule<
  object,
  ScreenGetSectionByAnnotationArgs
> = {
  command: "getSectionByAnnotation <url> <text>",
  describe: "어노테이션 텍스트로 해당 섹션(루트 레이어)을 찾습니다",
  builder: (yargs) =>
    yargs
      .positional("url", {
        type: "string",
        describe: "Zeplin 스크린 URL",
        demandOption: true,
      })
      .positional("text", {
        type: "string",
        describe: "검색할 어노테이션 텍스트",
        demandOption: true,
      }),
  handler: async (
    args: ArgumentsCamelCase<ScreenGetSectionByAnnotationArgs>,
  ) => {
    const { projectId, screenId } = parseZeplinScreenUrl(args.url);

    try {
      const [annotationsResponse, versionResponse] = await Promise.all([
        zeplinClient.screens.getScreenAnnotations(projectId, screenId),
        zeplinClient.screens.getLatestScreenVersion(projectId, screenId),
      ]);

      const annotations: Array<ScreenAnnotation> = annotationsResponse.data;
      const version = versionResponse.data;

      const matched = filterAnnotationsByText(annotations, args.text);

      console.log("=== 어노테이션 검색 결과 ===");
      console.log(`검색어: "${args.text}"`);
      console.log(`매칭된 어노테이션: ${String(matched.length)}개`);

      if (matched.length === 0) {
        return;
      }

      const rootLayers = version.layers;

      const results: Array<AnnotationMatch> = matched.map((annotation) => {
        const pixelCoordinate = toPixelCoordinate(
          annotation.position,
          version.width,
          version.height,
        );
        const rootLayer = findRootLayerAtPoint(rootLayers, pixelCoordinate);
        return { annotation, pixelCoordinate, rootLayer };
      });

      results.forEach((match, index) => {
        printAnnotationMatch(match, index);
      });
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

export { screenGetSectionByAnnotationCommand };
