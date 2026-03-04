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

- Node.js v22 이상 (네이티브 TypeScript 실행 및 `process.loadEnvFile` 사용)

```bash
# nvm 사용 시 프로젝트 디렉터리에서 아래 명령어로 Node.js 버전을 맞출 수 있습니다
nvm use
```

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

---

### `screen list`

프로젝트의 스크린 목록을 조회합니다.

```bash
node src/main.ts screen list --projectId <project-id> [--limit <n>] [--offset <n>]
```

| 옵션 | 축약 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `--projectId` | `-p` | O | - | 프로젝트 ID |
| `--limit` | `-l` | - | - | 조회할 최대 개수 |
| `--offset` | - | - | - | 페이지네이션 오프셋 |

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

### `screen spec`

Zeplin 스크린을 컴팩트 CSS 스펙으로 출력합니다. 레이어 트리를 ASCII 형식으로 표시하며, 각 레이어의 CSS 속성을 인라인으로 보여줍니다.

```bash
node src/main.ts screen spec <zeplin-screen-url> [--depth <n>] [--section <name>]
```

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `--depth` | `3` | 출력할 레이어 트리 깊이 |
| `--section` | - | 특정 레이어만 출력 (이름 부분 매칭) |

**예시:**

```bash
# 전체 스펙 출력
node src/main.ts screen spec https://app.zeplin.io/project/{projectId}/screen/{screenId}

# 깊이 제한 및 섹션 필터링
node src/main.ts screen spec https://app.zeplin.io/project/{projectId}/screen/{screenId} --depth 5 --section Header
```

---

### `screen clip`

스크린의 depth-1(최상위) 섹션 목록을 보여주고, 선택한 섹션의 레이어 트리를 클립보드에 복사합니다.

```bash
node src/main.ts screen clip <zeplin-screen-url>
```

**동작 방식:**

1. 스크린의 최상위 섹션 목록을 표시
2. 번호를 입력하면 해당 섹션의 레이어 트리를 클립보드에 복사
3. `0`을 입력하면 종료

---

### `screen getSectionByAnnotation`

어노테이션 텍스트로 해당 섹션(루트 레이어)을 찾습니다. 대소문자를 구분하지 않고 부분 매칭합니다.

```bash
node src/main.ts screen getSectionByAnnotation <zeplin-screen-url> <text>
```

**예시:**

```bash
node src/main.ts screen getSectionByAnnotation https://app.zeplin.io/project/{projectId}/screen/{screenId} "헤더"
```

---

## Zeplin URL 형식

모든 스크린 관련 명령어는 아래 형식의 Zeplin URL을 사용합니다.

```
https://app.zeplin.io/project/{projectId}/screen/{screenId}
```

브라우저에서 Zeplin 스크린을 열면 주소창에서 해당 URL을 확인할 수 있습니다.

---

## 참고 문서

- [Zeplin Layer/Node API 조회 가이드](docs/layer-api.md) — Zeplin API의 레이어 조회 방식 및 Layer 모델 구조 설명
