import type { Layer, Screen, ScreenVersion } from "@zeplin/sdk";
import type { Argv, CommandModule, ArgumentsCamelCase } from "yargs";
import { zeplinClient } from "../../zeplin.ts";
import { parseZeplinScreenUrl } from "../../parse-url.ts";
import { isApiError, getApiErrorMessage } from "../../api-error.ts";
import {
  formatCssColor,
  formatCssFill,
  formatCssBorder,
  formatCssBoxShadow,
  inferLayout,
  formatPaddingShorthand,
} from "../../formatters/layer.ts";

type ScreenSpecArgs = {
  url: string;
  depth: number;
  section?: string;
};

type SiblingGap = {
  gap: number;
  direction: "vertical" | "horizontal";
};

function formatCompactProps(layer: Layer): string {
  const parts: Array<string> = [];

  if (layer.fills && layer.fills.length > 0) {
    const bgParts = layer.fills.map((f) => formatCssFill(f));
    parts.push(`bg: ${bgParts.join(", ")}`);
  }

  if (layer.borderRadius != null && layer.borderRadius > 0) {
    parts.push(`rounded: ${String(Math.round(layer.borderRadius * 100) / 100)}px`);
  }

  if (layer.borders && layer.borders.length > 0) {
    const borderParts = layer.borders.map((b) => formatCssBorder(b));
    parts.push(`border: ${borderParts.join(", ")}`);
  }

  if (layer.shadows && layer.shadows.length > 0) {
    const shadowParts = layer.shadows.map((s) => formatCssBoxShadow(s));
    parts.push(`shadow: ${shadowParts.join(", ")}`);
  }

  if (layer.opacity !== 1) {
    parts.push(`opacity: ${String(Math.round(layer.opacity * 100) / 100)}`);
  }

  if (layer.blur) {
    const blurType = layer.blur.type ?? "gaussian";
    const radius = Math.round((layer.blur.radius ?? 0) * 100) / 100;
    if (blurType === "background") {
      parts.push(`backdrop-blur: ${String(radius)}px`);
    } else {
      parts.push(`blur: ${String(radius)}px`);
    }
  }

  return parts.join(" | ");
}

function formatCompactText(layer: Layer): string {
  if (
    layer.type !== "text" ||
    !layer.textStyles ||
    layer.textStyles.length === 0
  ) {
    return "";
  }

  const ts = layer.textStyles[0];
  const style = ts?.style;
  if (!style) return "";

  const parts: Array<string> = [];

  const lineHeight =
    style.lineHeight != null ? `/${String(style.lineHeight)}px` : "";
  parts.push(
    `font: ${style.fontFamily} ${String(style.fontWeight)} ${String(style.fontSize)}px${lineHeight}`,
  );

  if (style.color) {
    parts.push(`color: ${formatCssColor(style.color)}`);
  }

  if (style.letterSpacing != null && style.letterSpacing !== 0) {
    parts.push(`ls: ${String(style.letterSpacing)}px`);
  }

  if (style.textAlign) {
    parts.push(`align: ${style.textAlign}`);
  }

  return parts.join(" | ");
}

function formatTextContent(content: string): string {
  const escaped = content.replace(/\n/g, "\\n");
  if (escaped.length > 100) {
    return `"${escaped.substring(0, 97)}..."`;
  }
  return `"${escaped}"`;
}

function calculateSiblingGaps(
  children: Array<Layer>,
  direction: "row" | "column",
): Array<SiblingGap> {
  const gaps: Array<SiblingGap> = [];

  const sorted =
    direction === "column"
      ? [...children].sort((a, b) => a.rect.y - b.rect.y)
      : [...children].sort((a, b) => a.rect.x - b.rect.x);

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (!curr || !next) continue;

    const gap =
      direction === "column"
        ? Math.round(next.rect.y - (curr.rect.y + curr.rect.height))
        : Math.round(next.rect.x - (curr.rect.x + curr.rect.width));

    gaps.push({
      gap,
      direction: direction === "column" ? "vertical" : "horizontal",
    });
  }

  return gaps;
}

function getSortedChildren(
  children: Array<Layer>,
  direction: "row" | "column" | null,
): Array<Layer> {
  if (!direction) return children;
  return direction === "column"
    ? [...children].sort((a, b) => a.rect.y - b.rect.y)
    : [...children].sort((a, b) => a.rect.x - b.rect.x);
}

function processLayer(
  layer: Layer,
  depth: number,
  maxDepth: number,
  treePrefix: string,
  isLast: boolean,
): Array<string> {
  const lines: Array<string> = [];
  const connector = isLast ? "└" : "├";
  const childTreePrefix = isLast ? `${treePrefix}  ` : `${treePrefix}│ `;

  const name = layer.name ?? "(unnamed)";
  const isText = layer.type === "text";

  const sizePart = `${String(Math.round(layer.rect.width))}×${String(Math.round(layer.rect.height))}`;

  const typeSuffix = isText ? ` text ${sizePart}` : ` ${sizePart}`;

  const layout = inferLayout(layer);

  const headerParts: Array<string> = [];
  headerParts.push(`[${name}]${typeSuffix}`);

  const compactProps = formatCompactProps(layer);
  if (compactProps) {
    headerParts.push(compactProps);
  }

  if (layout) {
    const { padding } = layout;
    const parentW = layer.rect.width;
    const parentH = layer.rect.height;
    const isPaddingReasonable =
      padding.left + padding.right <= parentW &&
      padding.top + padding.bottom <= parentH;

    if (isPaddingReasonable) {
      const paddingStr = formatPaddingShorthand(padding);
      if (paddingStr) {
        headerParts.push(`pad: ${paddingStr}`);
      }
    }
    if (layout.direction) {
      headerParts.push(layout.direction === "column" ? "col" : "row");
    }
    if (layout.gap != null && layout.gap > 0) {
      headerParts.push(`gap: ${String(layout.gap)}px`);
    }
  }

  lines.push(`${treePrefix}${connector} ${headerParts.join(" | ")}`);

  if (isText) {
    const textInfo = formatCompactText(layer);
    if (textInfo) {
      lines.push(`${childTreePrefix}  ${textInfo}`);
    }
    if (layer.content) {
      lines.push(
        `${childTreePrefix}  text: ${formatTextContent(layer.content)}`,
      );
    }
  }

  const children = layer.layers;
  if (children && children.length > 0) {
    if (depth >= maxDepth) {
      lines.push(
        `${childTreePrefix}  [...${String(children.length)} children]`,
      );
    } else {
      const direction = layout?.direction ?? null;
      const sortedChildren = getSortedChildren(children, direction);

      const uniformGap = layout?.gap;
      const siblingGaps =
        !uniformGap && direction
          ? calculateSiblingGaps(children, direction)
          : null;

      for (let i = 0; i < sortedChildren.length; i++) {
        const child = sortedChildren[i];
        if (!child) continue;
        const childIsLast = i === sortedChildren.length - 1;

        const childLines = processLayer(
          child,
          depth + 1,
          maxDepth,
          childTreePrefix,
          childIsLast,
        );
        lines.push(...childLines);

        if (!childIsLast && siblingGaps && siblingGaps[i]) {
          const gapInfo = siblingGaps[i];
          if (gapInfo && gapInfo.gap !== 0) {
            const gapSymbol = gapInfo.direction === "vertical" ? "↕" : "↔";
            const gapPrefix = `${childTreePrefix}│ `;
            lines.push(gapPrefix);
            lines.push(`${gapPrefix}${gapSymbol} ${String(gapInfo.gap)}px`);
            lines.push(gapPrefix);
          }
        }
      }
    }
  }

  return lines;
}

function printSpecHeader(screen: Screen, version: ScreenVersion): void {
  const bg = version.backgroundColor
    ? formatCssColor(version.backgroundColor)
    : "none";

  console.log(
    `Screen: ${screen.name} (${String(version.width)}×${String(version.height)}, @${String(version.densityScale)}x)`,
  );
  console.log(`Background: ${bg}`);
  console.log(
    "================================================================",
  );
  console.log("");
}

function filterBySection(
  layers: Array<Layer>,
  sectionName: string,
): Array<Layer> {
  const lower = sectionName.toLowerCase();
  const matched = layers.filter((layer) => {
    const name = layer.name?.toLowerCase() ?? "";
    return name.includes(lower);
  });
  if (matched.length > 0) return matched;

  // 최상위 매칭 없으면 depth-1 자식에서 검색
  const childMatched: Array<Layer> = [];
  for (const layer of layers) {
    if (layer.layers) {
      for (const child of layer.layers) {
        const name = child.name?.toLowerCase() ?? "";
        if (name.includes(lower)) {
          childMatched.push(child);
        }
      }
    }
  }
  return childMatched;
}

const screenSpecCommand: CommandModule<object, ScreenSpecArgs> = {
  command: "spec <url>",
  describe: "Zeplin 스크린을 컴팩트 CSS 스펙으로 출력합니다",
  builder: (yargs) =>
    yargs
      .positional("url", {
        type: "string",
        describe: "Zeplin 스크린 URL",
        demandOption: true,
      })
      .option("depth", {
        type: "number",
        describe: "출력할 레이어 트리 깊이",
        default: 3,
      })
      .option("section", {
        type: "string",
        describe: "특정 최상위 레이어만 출력 (이름 부분매칭)",
      }) as unknown as Argv<ScreenSpecArgs>,
  handler: async (args: ArgumentsCamelCase<ScreenSpecArgs>) => {
    const { projectId, screenId } = parseZeplinScreenUrl(args.url);

    try {
      const [screenResponse, versionResponse] = await Promise.all([
        zeplinClient.screens.getScreen(projectId, screenId),
        zeplinClient.screens.getLatestScreenVersion(projectId, screenId),
      ]);

      const screen: Screen = screenResponse.data;
      const version: ScreenVersion = versionResponse.data;

      printSpecHeader(screen, version);

      let topLayers = version.layers;
      if (args.section) {
        topLayers = filterBySection(topLayers, args.section);
        if (topLayers.length === 0) {
          console.log(
            `"${args.section}" 이름을 포함하는 레이어를 찾을 수 없습니다.`,
          );
          return;
        }
      }

      for (let i = 0; i < topLayers.length; i++) {
        const layer = topLayers[i];
        if (!layer) continue;

        const lines = processLayer(
          layer,
          0,
          args.depth,
          "",
          i === topLayers.length - 1,
        );
        console.log(lines.join("\n"));

        if (i < topLayers.length - 1) {
          console.log("");
        }
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

export { screenSpecCommand };
