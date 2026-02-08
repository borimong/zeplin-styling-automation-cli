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

function getOutputFileName(asset: ClassifiedAsset): string {
  if (asset.format === "svg") {
    return `${asset.fileName}.svg`;
  }
  // 아이콘 PNG fallback은 PNG 유지, 이미지는 WebP 변환
  if (asset.isIcon) {
    return `${asset.fileName}.png`;
  }
  return `${asset.fileName}.webp`;
}

async function processAsset(
  asset: ClassifiedAsset,
  outputDir: string,
): Promise<{ fileName: string; filePath: string }> {
  const buffer = await downloadBuffer(asset.content.url);

  if (asset.format === "svg") {
    const outputFileName = `${asset.fileName}.svg`;
    const filePath = join(outputDir, outputFileName);
    await writeFile(filePath, buffer);
    return { fileName: outputFileName, filePath };
  }

  // 아이콘 PNG fallback: WebP 변환 없이 PNG 유지
  if (asset.isIcon) {
    const outputFileName = `${asset.fileName}.png`;
    const filePath = join(outputDir, outputFileName);
    await writeFile(filePath, buffer);
    return { fileName: outputFileName, filePath };
  }

  // 이미지: PNG → WebP 변환
  const outputFileName = `${asset.fileName}.webp`;
  const filePath = join(outputDir, outputFileName);
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
      console.log(`  ✓ ${downloaded.fileName}`);
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
