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

export type OutputWriter = (message: string) => void;

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
  writer: OutputWriter = console.log,
): void {
  textStyles.forEach((ts) => {
    const style = ts.style;
    if (!style) return;

    writer(`${indent}텍스트 스타일:`);
    writer(`${indent}  폰트: ${style.fontFamily} (${style.postscriptName})`);
    writer(
      `${indent}  크기: ${String(style.fontSize)}px / 무게: ${String(style.fontWeight)}`,
    );

    const lineHeight =
      style.lineHeight != null ? `${String(style.lineHeight)}px` : "-";
    const letterSpacing =
      style.letterSpacing != null ? `${String(style.letterSpacing)}px` : "-";
    writer(`${indent}  행간: ${lineHeight} / 자간: ${letterSpacing}`);

    if (style.textAlign) {
      writer(`${indent}  정렬: ${style.textAlign}`);
    }
    if (style.color) {
      writer(`${indent}  색상: ${formatColor(style.color)}`);
    }
  });
}

export function printLayerDetail(
  layer: Layer,
  prefix: string,
  writer: OutputWriter = console.log,
): void {
  const indent = prefix;
  const { rect } = layer;

  writer(
    `${indent}위치: (${String(rect.x)}, ${String(rect.y)}) 크기: ${String(rect.width)} x ${String(rect.height)}`,
  );

  writer(`${indent}opacity: ${String(layer.opacity)}`);
  if (layer.blendMode) {
    writer(`${indent}블렌드 모드: ${layer.blendMode}`);
  }
  if (layer.borderRadius != null) {
    writer(`${indent}모서리 반경: ${String(layer.borderRadius)}`);
  }
  if (layer.rotation != null) {
    writer(`${indent}회전: ${String(layer.rotation)}°`);
  }

  layer.fills?.forEach((fill) => {
    writer(`${indent}채우기: ${formatFill(fill)}`);
  });

  layer.borders?.forEach((border) => {
    writer(`${indent}보더: ${formatBorder(border)}`);
  });

  layer.shadows?.forEach((shadow) => {
    writer(`${indent}box-shadow: ${formatBoxShadow(shadow)}`);
    if (shadow.type !== "inner") {
      writer(`${indent}drop-shadow: ${formatDropShadow(shadow)}`);
    }
  });

  if (layer.blur) {
    const blurType = layer.blur.type ?? "gaussian";
    if (blurType === "background") {
      writer(`${indent}backdrop-blur: ${formatBlurRadius(layer.blur)}`);
    } else {
      writer(`${indent}blur: ${formatBlurRadius(layer.blur)}`);
    }
  }

  if (layer.type === "text" && layer.content) {
    writer(`${indent}내용: "${layer.content}"`);
  }

  if (
    layer.type === "text" &&
    layer.textStyles &&
    layer.textStyles.length > 0
  ) {
    formatTextStyles(layer.textStyles, indent, writer);
  }

  if (layer.exportable) {
    writer(`${indent}내보내기 가능`);
  }
}

export function printLayerTree(
  layers: Array<Layer>,
  prefix: string,
  _depth: number,
  writer: OutputWriter = console.log,
): void {
  layers.forEach((layer, index) => {
    const isLast = index === layers.length - 1;
    const connector = isLast ? "└─" : "├─";
    const childPrefix = isLast ? `${prefix}    ` : `${prefix}│   `;

    const componentLabel = layer.componentName
      ? ` (컴포넌트: ${layer.componentName})`
      : "";
    writer(
      `${prefix}${connector} [${layer.type}] ${layer.name ?? "(이름 없음)"}${componentLabel}`,
    );

    printLayerDetail(layer, `${childPrefix} `, writer);

    if (layer.layers && layer.layers.length > 0) {
      printLayerTree(layer.layers, childPrefix, _depth + 1, writer);
    }

    if (!isLast && (layer.layers?.length ?? 0) > 0) {
      writer(`${prefix}│`);
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

// === CSS 중심 포맷터 ===

const FONT_WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

export function formatCssColor(color: ColorData): string {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  const a = Math.round(color.a * 100) / 100;
  if (a === 1) {
    const hex = [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0").toUpperCase())
      .join("");
    return `#${hex}`;
  }
  return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(a)})`;
}

function fontWeightToName(weight: number): string {
  return FONT_WEIGHT_NAMES[weight] ?? String(weight);
}

function formatCssGradient(gradient: Gradient): string {
  const type = gradient.type ?? "linear";
  const stops =
    gradient.colorStops
      ?.map(
        (stop) =>
          `${formatCssColor(stop.color)} ${String(Math.round(stop.position * 100))}%`,
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

export function formatCssFill(fill: LayerFill): string {
  if (fill.type === "gradient" && fill.gradient) {
    return formatCssGradient(fill.gradient);
  }
  if (fill.color) {
    return formatCssColor(fill.color);
  }
  return fill.type;
}

export function formatCssBorder(border: LayerBorder): string {
  const thickness = Math.round((border.thickness ?? 1) * 100) / 100;
  const fill = border.fill ? formatCssFill(border.fill) : "none";
  return `${String(thickness)}px solid ${fill}`;
}

export function formatCssBoxShadow(shadow: LayerShadow): string {
  const inset = shadow.type === "inner" ? "inset " : "";
  const offsetX = Math.round((shadow.offsetX ?? 0) * 100) / 100;
  const offsetY = Math.round((shadow.offsetY ?? 0) * 100) / 100;
  const blur = Math.round((shadow.blurRadius ?? 0) * 100) / 100;
  const spread = Math.round((shadow.spread ?? 0) * 100) / 100;
  const colorStr = shadow.color ? formatCssColor(shadow.color) : "transparent";
  return `${inset}${String(offsetX)}px ${String(offsetY)}px ${String(blur)}px ${String(spread)}px ${colorStr}`;
}

export type LayoutInfo = {
  padding: { top: number; right: number; bottom: number; left: number };
  direction: "row" | "column" | null;
  gap: number | null;
};

export function inferLayout(layer: Layer): LayoutInfo | null {
  const children = layer.layers;
  if (!children || children.length === 0) return null;

  const pr = layer.rect;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    minX = Math.min(minX, child.rect.x);
    minY = Math.min(minY, child.rect.y);
    maxX = Math.max(maxX, child.rect.x + child.rect.width);
    maxY = Math.max(maxY, child.rect.y + child.rect.height);
  }

  const padding = {
    top: Math.max(0, Math.round(minY - pr.y)),
    right: Math.max(0, Math.round(pr.x + pr.width - maxX)),
    bottom: Math.max(0, Math.round(pr.y + pr.height - maxY)),
    left: Math.max(0, Math.round(minX - pr.x)),
  };

  if (children.length === 1) {
    return { padding, direction: null, gap: null };
  }

  const sortedByY = [...children].sort((a, b) => a.rect.y - b.rect.y);
  const sortedByX = [...children].sort((a, b) => a.rect.x - b.rect.x);

  const verticalGaps: Array<number> = [];
  let hasVerticalOverlap = false;
  for (let i = 0; i < sortedByY.length - 1; i++) {
    const curr = sortedByY[i];
    const next = sortedByY[i + 1];
    if (!curr || !next) continue;
    const gap = Math.round(next.rect.y - (curr.rect.y + curr.rect.height));
    verticalGaps.push(gap);
    if (gap < -5) hasVerticalOverlap = true;
  }

  const horizontalGaps: Array<number> = [];
  let hasHorizontalOverlap = false;
  for (let i = 0; i < sortedByX.length - 1; i++) {
    const curr = sortedByX[i];
    const next = sortedByX[i + 1];
    if (!curr || !next) continue;
    const gap = Math.round(next.rect.x - (curr.rect.x + curr.rect.width));
    horizontalGaps.push(gap);
    if (gap < -5) hasHorizontalOverlap = true;
  }

  let direction: "row" | "column" | null;
  let gaps: Array<number>;

  if (!hasVerticalOverlap && hasHorizontalOverlap) {
    direction = "column";
    gaps = verticalGaps;
  } else if (hasVerticalOverlap && !hasHorizontalOverlap) {
    direction = "row";
    gaps = horizontalGaps;
  } else if (!hasVerticalOverlap && !hasHorizontalOverlap) {
    const lastY = sortedByY[sortedByY.length - 1];
    const firstY = sortedByY[0];
    const lastX = sortedByX[sortedByX.length - 1];
    const firstX = sortedByX[0];
    if (!lastY || !firstY || !lastX || !firstX) {
      return { padding, direction: null, gap: null };
    }
    const ySpread = lastY.rect.y + lastY.rect.height - firstY.rect.y;
    const xSpread = lastX.rect.x + lastX.rect.width - firstX.rect.x;
    direction = ySpread >= xSpread ? "column" : "row";
    gaps = direction === "column" ? verticalGaps : horizontalGaps;
  } else {
    return { padding, direction: null, gap: null };
  }

  const firstGap = gaps[0];
  const uniformGap =
    gaps.length > 0 &&
    firstGap != null &&
    firstGap > 0 &&
    gaps.every((g) => Math.abs(g - firstGap) <= 2)
      ? firstGap
      : null;

  return { padding, direction, gap: uniformGap };
}

export function formatPaddingShorthand(p: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}): string {
  if (p.top === 0 && p.right === 0 && p.bottom === 0 && p.left === 0) {
    return "";
  }
  if (p.top === p.right && p.right === p.bottom && p.bottom === p.left) {
    return `${String(p.top)}px`;
  }
  if (p.top === p.bottom && p.left === p.right) {
    return `${String(p.top)}px ${String(p.right)}px`;
  }
  if (p.left === p.right) {
    return `${String(p.top)}px ${String(p.right)}px ${String(p.bottom)}px`;
  }
  return `${String(p.top)}px ${String(p.right)}px ${String(p.bottom)}px ${String(p.left)}px`;
}

function printCssLayerDetail(
  layer: Layer,
  indent: string,
  writer: OutputWriter = console.log,
): void {
  const layout = inferLayout(layer);
  if (layout) {
    const paddingStr = formatPaddingShorthand(layout.padding);
    if (paddingStr) {
      writer(`${indent}padding: ${paddingStr}`);
    }
    if (layout.direction) {
      writer(`${indent}flex-direction: ${layout.direction}`);
    }
    if (layout.gap != null && layout.gap > 0) {
      writer(`${indent}gap: ${String(layout.gap)}px`);
    }
  }

  if (layer.opacity !== 1) {
    writer(`${indent}opacity: ${String(layer.opacity)}`);
  }

  if (layer.fills && layer.fills.length > 0) {
    layer.fills.forEach((fill) => {
      writer(`${indent}background: ${formatCssFill(fill)}`);
    });
  }

  if (layer.borderRadius != null && layer.borderRadius > 0) {
    writer(`${indent}border-radius: ${String(layer.borderRadius)}px`);
  }

  if (layer.borders && layer.borders.length > 0) {
    layer.borders.forEach((border) => {
      writer(`${indent}border: ${formatCssBorder(border)}`);
    });
  }

  if (layer.shadows && layer.shadows.length > 0) {
    const shadowStrs = layer.shadows.map(formatCssBoxShadow);
    writer(`${indent}box-shadow: ${shadowStrs.join(", ")}`);
  }

  if (layer.blur) {
    const blurType = layer.blur.type ?? "gaussian";
    const radius = layer.blur.radius ?? 0;
    if (blurType === "background") {
      writer(`${indent}backdrop-filter: blur(${String(radius)}px)`);
    } else {
      writer(`${indent}filter: blur(${String(radius)}px)`);
    }
  }

  if (layer.type === "text" && layer.content) {
    writer(`${indent}content: "${layer.content}"`);
  }

  if (
    layer.type === "text" &&
    layer.textStyles &&
    layer.textStyles.length > 0
  ) {
    layer.textStyles.forEach((ts) => {
      const style = ts.style;
      if (!style) return;
      const weightName = fontWeightToName(style.fontWeight);
      const lineHeight =
        style.lineHeight != null ? `/${String(style.lineHeight)}px` : "";
      writer(
        `${indent}font: ${style.fontFamily} ${weightName} ${String(style.fontSize)}px${lineHeight}`,
      );
      if (style.color) {
        writer(`${indent}color: ${formatCssColor(style.color)}`);
      }
      if (style.letterSpacing != null && style.letterSpacing !== 0) {
        writer(`${indent}letter-spacing: ${String(style.letterSpacing)}px`);
      }
      if (style.textAlign) {
        writer(`${indent}text-align: ${style.textAlign}`);
      }
    });
  }
}

export function printCssLayerTree(
  layers: Array<Layer>,
  depth: number,
  writer: OutputWriter = console.log,
): void {
  const indent = "  ".repeat(depth);
  const propIndent = "  ".repeat(depth + 1);

  layers.forEach((layer, index) => {
    const name = layer.name ?? "(이름 없음)";
    const componentLabel = layer.componentName
      ? ` [${layer.componentName}]`
      : "";
    const sizeLabel =
      layer.type !== "text"
        ? ` (${String(layer.rect.width)} × ${String(layer.rect.height)})`
        : "";

    writer(`${indent}${name}${sizeLabel}${componentLabel}:`);
    printCssLayerDetail(layer, propIndent, writer);

    if (layer.layers && layer.layers.length > 0) {
      printCssLayerTree(layer.layers, depth + 1, writer);
    }

    const hasChildren = (layer.layers?.length ?? 0) > 0;
    if (hasChildren && index < layers.length - 1) {
      writer("");
    }
  });
}
