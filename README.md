# Zeplin CLI

Zeplin API를 CLI로 사용할 수 있는 도구입니다. 스크린 정보 조회, 에셋 다운로드, 어노테이션 검색 등을 터미널에서 바로 수행할 수 있습니다.

## 설치

```bash
# 프로젝트 클론 후 의존성 설치
git clone <repository-url>
cd zeplin-cli
npm install
```

### Node.js 요구사항

- Node.js v22 이상 (`.env` 자동 로딩을 위한 `process.loadEnvFile` 사용)

## 환경 설정

프로젝트 루트에 `.env` 파일을 생성하고 Zeplin Personal Access Token을 설정합니다.

```bash
ZEPLIN_TOKEN=your_zeplin_token_here
```

토큰은 [Zeplin > Settings > Access Tokens](https://app.zeplin.io/profile/connected-apps)에서 발급할 수 있습니다.

## 사용법

```bash
node src/main.ts <command> [options]
```

> 각자의 로컬 환경에 맞게 경로를 조정해주세요.

---

## ⚡ Zeplin 스크린 기반 스타일 비교 워크플로우

> **Claude Code와 함께 사용할 때 반드시 이 워크플로우를 따를 것.**

구현한 코드가 Zeplin 디자인 스펙과 스타일링적으로 일치하는지 비교하고, 차이점을 수정하는 워크플로우입니다.

### 실행 방법

**1단계: Zeplin 스크린 정보 조회**

```bash
node /Users/nudge_0079/zeplin-cli/src/main.ts screen get <zeplin-screen-url>
```

이 명령어를 실행하면 해당 스크린의 모든 디자인 정보(레이어 트리, 스타일, 간격, 폰트 등)를 조회할 수 있습니다.

**2단계: 구현 코드와 스타일 차이 분석**

조회한 스크린 정보를 기반으로, 현재 구현된 코드와 **스타일링적으로 다른 부분을 모두** 찾습니다.

비교 대상 항목:
- 노드 간 모든 간격 (gap, margin, padding)
- 컬러 (배경색, 텍스트 색상, 보더 색상 등)
- 폰트 (font-family, font-size, font-weight, line-height, letter-spacing)
- 크기 (width, height)
- 기타 스타일 속성 (border-radius, opacity, box-shadow 등)

**특히 노드 간 간격이 다른 부분을 빠짐없이 모두 찾아야 합니다.**

**3단계: 차이점을 표 형식으로 정리**

발견된 모든 차이점을 아래와 같은 표 형식으로 보여줍니다:

| # | 대상 요소 | 속성 | 현재 값 | Zeplin 스펙 값 | 비고 |
|---|----------|------|--------|---------------|------|
| 1 | `.header` | `padding` | `16px` | `20px` | 상하 패딩 |
| 2 | `.title` | `font-size` | `14px` | `16px` | |
| ... | ... | ... | ... | ... | ... |

**4단계: 수정 사항 선택**

`AskUserQuestion` 도구를 사용하여 각 수정 사항을 반영할지 여부를 사용자에게 물어봅니다. 사용자가 선택한 항목만 코드에 반영합니다.

### 사용 예시

```
Zeplin 스크린 URL: https://app.zeplin.io/project/697ff1797274167fe6435114/screen/69894baa1749382c2f649774

위 스크린과 현재 구현된 코드의 스타일 차이를 비교해줘.
```

---

## 명령어

### `screen get`

Zeplin 스크린의 상세 정보를 조회합니다. 기본 정보, 버전 정보, 레이어 트리, 에셋, 링크 등을 출력합니다.

```bash
node src/main.ts screen get <zeplin-screen-url>
```

**예시:**

```bash
node src/main.ts screen get https://app.zeplin.io/project/{projectId}/screen/{screenId}
```

**동작 확인:**

출력 결과를 파일로 리다이렉트하면 명령어의 동작 여부를 확인할 수 있습니다.

```bash
node src/main.ts screen get https://app.zeplin.io/project/{projectId}/screen/{screenId} > output.txt
```

`output.txt` 파일을 열어 스크린 정보가 정상적으로 출력되었는지 확인하세요.

---

### `screen list`

프로젝트에 포함된 스크린 목록을 JSON 형태로 조회합니다.

```bash
node src/main.ts screen list -p <projectId> [--limit <number>] [--offset <number>]
```

| 옵션 | 축약 | 필수 | 설명 |
| --- | --- | --- | --- |
| `--projectId` | `-p` | O | Zeplin 프로젝트 ID |
| `--limit` | `-l` | X | 조회할 최대 개수 |
| `--offset` | | X | 페이지네이션 오프셋 |

**예시:**

```bash
node src/main.ts screen list -p 697ff1797274167fe6435114 --limit 10
```

---

### `screen download`

스크린에 포함된 에셋을 다운로드합니다. 아이콘/이미지를 자동 분류하고, 밀도(density) 선택 및 WebP 변환을 지원합니다.

```bash
node src/main.ts screen download <zeplin-screen-url> [-o <output-dir>]
```

| 옵션 | 축약 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `--output` | `-o` | `./assets` | 에셋을 저장할 디렉터리 경로 |

**예시:**

```bash
node src/main.ts screen download https://app.zeplin.io/project/{projectId}/screen/{screenId} -o ./my-assets
```

---

### `screen getSectionByAnnotation`

어노테이션 텍스트를 검색하여 해당 위치의 루트 레이어(섹션)를 찾습니다.

```bash
node src/main.ts screen getSectionByAnnotation <zeplin-screen-url> <search-text>
```

**예시:**

```bash
node src/main.ts screen getSectionByAnnotation https://app.zeplin.io/project/{projectId}/screen/{screenId} "헤더"
```

---

### `screen clip`

스크린의 depth-1 레이어 섹션 목록을 표시하고, 선택한 섹션의 레이어 정보를 클립보드에 복사합니다. (macOS 전용)

```bash
node src/main.ts screen clip <zeplin-screen-url>
```

실행하면 대화형 프롬프트가 나타나며, 번호를 입력하여 원하는 섹션을 클립보드에 복사할 수 있습니다. `0`을 입력하면 종료됩니다.

---

## Zeplin URL 형식

모든 스크린 관련 명령어는 아래 형식의 Zeplin URL을 사용합니다.

```
https://app.zeplin.io/project/{projectId}/screen/{screenId}
```

브라우저에서 Zeplin 스크린을 열면 주소창에서 해당 URL을 확인할 수 있습니다.
