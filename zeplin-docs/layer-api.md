# Zeplin Layer/Node API 조회 가이드

## 개요

Zeplin API에는 개별 레이어를 직접 조회하는 엔드포인트가 없다.
전체 Screen/Component Version을 가져온 후 클라이언트 측에서 `layers` 배열을 재귀 탐색하여 원하는 노드를 찾아야 한다.

## 레이어 조회 API

### Screen 레이어 (레이어 데이터 포함)

| SDK 메서드                                                    | REST 엔드포인트                                                           | 반환 타입       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------- |
| `ScreensApi.getLatestScreenVersion(projectId, screenId)`      | `GET /v1/projects/{project_id}/screens/{screen_id}/versions/latest`       | `ScreenVersion` |
| `ScreensApi.getScreenVersion(projectId, screenId, versionId)` | `GET /v1/projects/{project_id}/screens/{screen_id}/versions/{version_id}` | `ScreenVersion` |

### Component 레이어 (레이어 데이터 포함)

| SDK 메서드                                                                     | REST 엔드포인트                                                                 | 반환 타입          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------ |
| `ComponentsApi.getProjectComponentLatestVersion(projectId, componentId)`       | `GET /v1/projects/{project_id}/components/{component_id}/versions/latest`       | `ComponentVersion` |
| `ComponentsApi.getStyleguideComponentLatestVersion(styleguideId, componentId)` | `GET /v1/styleguides/{styleguide_id}/components/{component_id}/versions/latest` | `ComponentVersion` |

### Screen 메타데이터만 (레이어 미포함)

| SDK 메서드                                            | 반환 타입          |
| ----------------------------------------------------- | ------------------ |
| `ScreensApi.getScreen(projectId, screenId)`           | `Screen`           |
| `ScreensApi.getProjectScreens(projectId)`             | `Array<Screen>`    |
| `ScreensApi.getScreenComponents(projectId, screenId)` | `Array<Component>` |

`getScreenComponents`는 `includeLatestVersion: true` 옵션으로 `ComponentVersion.layers`에 접근 가능.

## 식별자 체계

| 식별자     | 설명                                | 고유성              | optional |
| ---------- | ----------------------------------- | ------------------- | -------- |
| `id`       | Zeplin 내부 고유 ID                 | Zeplin 내 고유      | 필수     |
| `sourceId` | 디자인 도구(Figma 등)에서의 노드 ID | 디자인 파일 내 고유 | optional |
| `name`     | 디자이너가 설정한 이름              | 중복 가능           | optional |

- `sourceId`는 Figma 노드 ID(예: `1:234`)에 해당한다.
- `Asset.layerSourceId`를 통해 에셋과 레이어를 매핑할 수 있으며, 이는 `Layer.sourceId`와 대응된다.

## Layer 모델 구조

```typescript
interface Layer {
  id: string;
  sourceId?: string;
  type: "text" | "shape" | "group";
  name?: string;
  rect: BoundingRectangle; // x, y, width, height
  fills?: Array<LayerFill>;
  borders?: Array<LayerBorder>;
  shadows?: Array<LayerShadow>;
  blur?: LayerBlur;
  opacity: number; // [0, 1]
  blendMode?: BlendModeEnum;
  borderRadius?: number;
  rotation?: number;
  exportable?: boolean;
  content?: string; // 텍스트 레이어의 텍스트 내용
  textStyles?: Array<LayerTextStyle>;
  layers?: Array<Layer>; // 자식 레이어 (재귀적 트리 구조)
  componentName?: string;
}
```

## 특정 레이어 검색 전략

### 이름 기반 검색

Zeplin 공식 MCP 서버가 채택한 방식. `targetLayerName`으로 전체 트리에서 이름이 일치하는 레이어를 필터링한다.

- 장점: 직관적, UI에서 보이는 이름을 그대로 사용 가능
- 단점: 이름 중복 시 의도와 다른 레이어가 반환될 수 있음

### sourceId 기반 검색

디자인 도구의 노드 ID로 검색. Figma URL에서 노드 ID를 추출하여 사용할 수 있다.

- 장점: 고유성이 높아 정확한 매칭 가능
- 단점: `sourceId`가 optional이므로 없는 경우도 있음

### 재귀 탐색 구현 (참고)

`layers` 필드가 `Array<Layer>`로 재귀적 구조이므로, group 내부의 자식 레이어를 찾으려면 재귀 탐색이 필수적이다.

```typescript
const findLayer = (
  layers: Array<Layer>,
  predicate: (layer: Layer) => boolean,
): Layer | undefined => {
  for (const layer of layers) {
    if (predicate(layer)) return layer;
    if (layer.layers) {
      const found = findLayer(layer.layers, predicate);
      if (found) return found;
    }
  }
  return undefined;
};

// sourceId로 검색
findLayer(screenVersion.layers, (l) => l.sourceId === targetSourceId);

// name으로 검색
findLayer(screenVersion.layers, (l) => l.name === targetName);
```
