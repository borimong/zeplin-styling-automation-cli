# Zeplin CLI

Zeplin API를 CLI 형태로 제공하는 도구.

## API 참고 문서

- Zeplin API 문서: https://docs.zeplin.dev/reference/introduction
- API 호출은 `@zeplin/sdk` 패키지를 사용
- 프로젝트 내 `zeplin-docs/` 디렉터리에 API 조사 결과 및 참고 자료를 정리해둔다

## 프로젝트 구조

```
src/
  main.ts      # CLI 진입점
  zeplin.ts    # Zeplin API 클라이언트 설정
```

## 핵심 원칙

- Type safety를 최우선으로 한다. `as`, `any`, `@ts-ignore` 등 타입 우회 수단을 사용하지 않는다.
- 타입 추론에 의존하기보다 명시적 타입 선언을 우선한다.
- 런타임 에러보다 컴파일 타임에 잡을 수 있도록 타입을 설계한다.

## 개발 환경

- 패키지 매니저: npm
- TypeScript strict 모드 활성화
- ESM (`"type": "module"`)

## 명령어

- `npm run start` — CLI 실행
- `npm run typecheck` — 타입 체크 (코드 수정 후 반드시 실행)

## 코드 수정 후 체크리스트

1. `npm run typecheck` 실행하여 타입 에러 확인
