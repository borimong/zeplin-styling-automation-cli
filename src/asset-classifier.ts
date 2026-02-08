import type { Asset, AssetContent } from "@zeplin/sdk";
import { selectPrompt } from "./prompts.ts";

type AssetFormat = "svg" | "png";

interface ClassifiedAsset {
  displayName: string;
  fileName: string;
  format: AssetFormat;
  isIcon: boolean;
  content: AssetContent;
}

const ICON_PATTERNS = [/icon/i, /^ic_/, /^ico/i, /^ic-/i];

function isIcon(displayName: string): boolean {
  return ICON_PATTERNS.some((pattern) => pattern.test(displayName));
}

function sanitizeFileName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function makeUniqueFileName(baseName: string, usedNames: Set<string>): string {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let suffix = 1;
  while (usedNames.has(`${baseName}_${String(suffix).padStart(2, "0")}`)) {
    suffix++;
  }

  const uniqueName = `${baseName}_${String(suffix).padStart(2, "0")}`;
  usedNames.add(uniqueName);
  return uniqueName;
}

function selectDensityContent(
  contents: Array<AssetContent>,
  targetFormat: AssetFormat,
): AssetContent | "prompt-needed" | undefined {
  const formatContents = contents.filter((c) => c.format === targetFormat);

  if (formatContents.length === 0) {
    return undefined;
  }

  if (formatContents.length === 1) {
    return formatContents[0];
  }

  const densityContents = formatContents.filter((c) => c.density !== undefined);

  if (densityContents.length < 3) {
    const sorted = [...densityContents].sort(
      (a, b) => (b.density ?? 0) - (a.density ?? 0),
    );
    return sorted[0] ?? formatContents[0];
  }

  const x2 = densityContents.find((c) => c.density === 2);
  if (x2) {
    return x2;
  }

  return "prompt-needed";
}

async function promptForDensity(
  asset: Asset,
  contents: Array<AssetContent>,
): Promise<AssetContent> {
  const options = contents
    .filter((c) => c.density !== undefined)
    .sort((a, b) => (a.density ?? 0) - (b.density ?? 0))
    .map((c) => ({
      label: `@${String(c.density)}x (${c.format})`,
      value: c,
    }));

  return selectPrompt(
    `"${asset.displayName}" 에셋의 밀도를 선택해주세요:`,
    options,
  );
}

export async function classifyAndSelectAssets(
  assets: Array<Asset>,
): Promise<Array<ClassifiedAsset>> {
  const usedNames = new Set<string>();
  const result: Array<ClassifiedAsset> = [];

  for (const asset of assets) {
    const icon = isIcon(asset.displayName);
    const baseName = sanitizeFileName(asset.displayName);
    const fileName = makeUniqueFileName(baseName, usedNames);

    if (icon) {
      const svgContent = selectDensityContent(asset.contents, "svg");

      if (svgContent === "prompt-needed") {
        const chosen = await promptForDensity(
          asset,
          asset.contents.filter((c) => c.format === "svg"),
        );
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "svg",
          isIcon: true,
          content: chosen,
        });
        continue;
      }

      if (svgContent) {
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "svg",
          isIcon: true,
          content: svgContent,
        });
        continue;
      }

      // SVG가 없으면 PNG fallback
      const pngContent = selectDensityContent(asset.contents, "png");

      if (pngContent === "prompt-needed") {
        const chosen = await promptForDensity(
          asset,
          asset.contents.filter((c) => c.format === "png"),
        );
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "png",
          isIcon: true,
          content: chosen,
        });
        continue;
      }

      if (pngContent) {
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "png",
          isIcon: true,
          content: pngContent,
        });
      }
    } else {
      const pngContent = selectDensityContent(asset.contents, "png");

      if (pngContent === "prompt-needed") {
        const chosen = await promptForDensity(
          asset,
          asset.contents.filter((c) => c.format === "png"),
        );
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "png",
          isIcon: false,
          content: chosen,
        });
        continue;
      }

      if (pngContent) {
        result.push({
          displayName: asset.displayName,
          fileName,
          format: "png",
          isIcon: false,
          content: pngContent,
        });
      }
    }
  }

  return result;
}

export type { ClassifiedAsset };
