import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { ClassifiedAsset } from "./asset-classifier.ts";

interface DownloadResult {
  success: Array<{ fileName: string; filePath: string }>;
  failed: Array<{ fileName: string; error: string }>;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `다운로드 실패: ${String(response.status)} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function getDensitySuffix(density: number | undefined): string {
  if (density === undefined) {
    return "";
  }
  return `@${String(density)}x`;
}

function formatDensityLabel(density: number | undefined): string {
  if (density === undefined) {
    return "";
  }
  return ` (@${String(density)}x)`;
}

function getOutputFileName(asset: ClassifiedAsset): string {
  const suffix = getDensitySuffix(asset.density);

  if (asset.format === "svg") {
    return `${asset.fileName}${suffix}.svg`;
  }
  if (asset.isIcon) {
    return `${asset.fileName}${suffix}.png`;
  }
  return `${asset.fileName}${suffix}.webp`;
}

async function processAsset(
  asset: ClassifiedAsset,
  outputDir: string,
): Promise<{ fileName: string; filePath: string }> {
  const buffer = await downloadBuffer(asset.content.url);
  const outputFileName = getOutputFileName(asset);
  const filePath = join(outputDir, outputFileName);

  if (asset.format === "svg") {
    await writeFile(filePath, buffer);
    return { fileName: outputFileName, filePath };
  }

  if (asset.isIcon) {
    await writeFile(filePath, buffer);
    return { fileName: outputFileName, filePath };
  }

  const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
  await writeFile(filePath, webpBuffer);
  return { fileName: outputFileName, filePath };
}

export async function downloadAllAssets(
  assets: Array<ClassifiedAsset>,
  outputDir: string,
): Promise<DownloadResult> {
  await mkdir(outputDir, { recursive: true });

  const result: DownloadResult = {
    success: [],
    failed: [],
  };

  for (const asset of assets) {
    try {
      const downloaded = await processAsset(asset, outputDir);
      result.success.push(downloaded);
      const densityLabel = formatDensityLabel(asset.density);
      console.log(`  ✓ ${downloaded.fileName}${densityLabel}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      result.failed.push({
        fileName: getOutputFileName(asset),
        error: errorMessage,
      });
      console.error(`  ✗ ${asset.fileName}: ${errorMessage}`);
    }
  }

  return result;
}
