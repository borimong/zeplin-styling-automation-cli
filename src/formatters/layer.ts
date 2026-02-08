import type {
  Asset,
  ColorData,
  Gradient,
  Layer,
  LayerBlur,
  LayerBorder,
  LayerFill,
  LayerShadow,
  LayerTextStyle,
  Link,
} from "@zeplin/sdk";

export function formatColor(color: ColorData): string {
  return `rgba(${String(color.r)}, ${String(color.g)}, ${String(color.b)}, ${String(color.a)})`;
}

function formatGradient(gradient: Gradient): string {
  const type = gradient.type ?? "linear";
  const stops =
    gradient.colorStops
      ?.map(
        (stop) =>
          `${formatColor(stop.color)} ${String(Math.round(stop.position * 100))}%`,
      )
      .join(", ") ?? "";

  if (type === "linear") {
    const angle = gradient.angle ?? 0;
    return `linear-gradient(${String(angle)}deg, ${stops})`;
  }
  if (type === "radial") {
    return `radial-gradient(${stops})`;
  }
  return `angular-gradient(${stops})`;
}

function formatFill(fill: LayerFill): string {
  let result: string;
  if (fill.type === "gradient" && fill.gradient) {
    result = formatGradient(fill.gradient);
  } else if (fill.color) {
    result = formatColor(fill.color);
  } else {
    result = fill.type;
  }

  if (fill.blendMode) {
    result += ` (${fill.blendMode})`;
  }
  return result;
}

function formatBorder(border: LayerBorder): string {
  const position = border.position ?? "center";
  const thickness = border.thickness ?? 1;
  const fillStr = border.fill ? formatFill(border.fill) : "none";
  return `${position} ${String(thickness)}px ${fillStr}`;
}

function formatBoxShadow(shadow: LayerShadow): string {
  const inset = shadow.type === "inner" ? "inset " : "";
  const offsetX = shadow.offsetX ?? 0;
  const offsetY = shadow.offsetY ?? 0;
  const blur = shadow.blurRadius ?? 0;
  const spread = shadow.spread ?? 0;
  const colorStr = shadow.color ? formatColor(shadow.color) : "transparent";
  return `${inset}${String(offsetX)}px ${String(offsetY)}px ${String(blur)}px ${String(spread)}px ${colorStr}`;
}

function formatDropShadow(shadow: LayerShadow): string {
  const offsetX = shadow.offsetX ?? 0;
  const offsetY = shadow.offsetY ?? 0;
  const blur = shadow.blurRadius ?? 0;
  const colorStr = shadow.color ? formatColor(shadow.color) : "transparent";
  return `${String(offsetX)}px ${String(offsetY)}px ${String(blur)}px ${colorStr}`;
}

function formatBlurRadius(blur: LayerBlur): string {
  const radius = blur.radius ?? 0;
  return `${String(radius)}px`;
}

function formatTextStyles(
  textStyles: Array<LayerTextStyle>,
  indent: string,
): void {
  textStyles.forEach((ts) => {
    const style = ts.style;
    if (!style) return;

    console.log(`${indent}텍스트 스타일:`);
    console.log(
      `${indent}  폰트: ${style.fontFamily} (${style.postscriptName})`,
    );
    console.log(
      `${indent}  크기: ${String(style.fontSize)}px / 무게: ${String(style.fontWeight)}`,
    );

    const lineHeight =
      style.lineHeight != null ? `${String(style.lineHeight)}px` : "-";
    const letterSpacing =
      style.letterSpacing != null ? `${String(style.letterSpacing)}px` : "-";
    console.log(`${indent}  행간: ${lineHeight} / 자간: ${letterSpacing}`);

    if (style.textAlign) {
      console.log(`${indent}  정렬: ${style.textAlign}`);
    }
    if (style.color) {
      console.log(`${indent}  색상: ${formatColor(style.color)}`);
    }
  });
}

function printLayerDetail(layer: Layer, prefix: string): void {
  const indent = prefix;
  const { rect } = layer;

  console.log(
    `${indent}위치: (${String(rect.x)}, ${String(rect.y)}) 크기: ${String(rect.width)} x ${String(rect.height)}`,
  );

  console.log(`${indent}opacity: ${String(layer.opacity)}`);
  if (layer.blendMode) {
    console.log(`${indent}블렌드 모드: ${layer.blendMode}`);
  }
  if (layer.borderRadius != null) {
    console.log(`${indent}모서리 반경: ${String(layer.borderRadius)}`);
  }
  if (layer.rotation != null) {
    console.log(`${indent}회전: ${String(layer.rotation)}°`);
  }

  layer.fills?.forEach((fill) => {
    console.log(`${indent}채우기: ${formatFill(fill)}`);
  });

  layer.borders?.forEach((border) => {
    console.log(`${indent}보더: ${formatBorder(border)}`);
  });

  layer.shadows?.forEach((shadow) => {
    console.log(`${indent}box-shadow: ${formatBoxShadow(shadow)}`);
    if (shadow.type !== "inner") {
      console.log(`${indent}drop-shadow: ${formatDropShadow(shadow)}`);
    }
  });

  if (layer.blur) {
    const blurType = layer.blur.type ?? "gaussian";
    if (blurType === "background") {
      console.log(`${indent}backdrop-blur: ${formatBlurRadius(layer.blur)}`);
    } else {
      console.log(`${indent}blur: ${formatBlurRadius(layer.blur)}`);
    }
  }

  if (layer.type === "text" && layer.content) {
    console.log(`${indent}내용: "${layer.content}"`);
  }

  if (
    layer.type === "text" &&
    layer.textStyles &&
    layer.textStyles.length > 0
  ) {
    formatTextStyles(layer.textStyles, indent);
  }

  if (layer.exportable) {
    console.log(`${indent}내보내기 가능`);
  }
}

export function printLayerTree(
  layers: Array<Layer>,
  prefix: string,
  _depth: number,
): void {
  layers.forEach((layer, index) => {
    const isLast = index === layers.length - 1;
    const connector = isLast ? "└─" : "├─";
    const childPrefix = isLast ? `${prefix}    ` : `${prefix}│   `;

    const componentLabel = layer.componentName
      ? ` (컴포넌트: ${layer.componentName})`
      : "";
    console.log(
      `${prefix}${connector} [${layer.type}] ${layer.name ?? "(이름 없음)"}${componentLabel}`,
    );

    printLayerDetail(layer, `${childPrefix} `);

    if (layer.layers && layer.layers.length > 0) {
      printLayerTree(layer.layers, childPrefix, _depth + 1);
    }

    if (!isLast && (layer.layers?.length ?? 0) > 0) {
      console.log(`${prefix}│`);
    }
  });
}

export function printAssets(assets: Array<Asset>): void {
  if (assets.length === 0) return;

  console.log("\n=== 에셋 ===");
  assets.forEach((asset, index) => {
    const layerLabel = asset.layerName ? ` (레이어: ${asset.layerName})` : "";
    console.log(`  [${String(index + 1)}] ${asset.displayName}${layerLabel}`);

    const contentDescriptions = asset.contents.map((c) => {
      if (c.density != null) {
        return `${c.format} @${String(c.density)}x`;
      }
      return c.format;
    });
    console.log(`      ${contentDescriptions.join(", ")}`);
  });
}

export function printLinks(links: Array<Link>): void {
  if (links.length === 0) return;

  console.log("\n=== 링크 ===");
  links.forEach((link, index) => {
    const { rect } = link;
    console.log(
      `  [${String(index + 1)}] (${String(rect.x)}, ${String(rect.y)}) ${String(rect.width)}x${String(rect.height)} -> "${link.destination.name}" (${link.destination.type})`,
    );
  });
}
