# ADR-001: 외부 HTTP 클라이언트 없이 Node.js 내장 fetch 기반 DORA 수집기 구현

- **상태 (Status)**: Accepted
- **결정일 (Date)**: 2026-11-12
- **결정자 (Deciders)**: @rkdtks1446-ui

## 1. 배경 및 맥락 (Context)
- GitHub Actions에서 매주 DORA 4대 지표를 수집할 때 `axios`나 `@octokit/rest` 같은 외부 패키지를 설치하면 워크플로우 실행 시간과 의존성 관리 비용이 증가합니다.

## 2. 결정 사항 (Decision)
- Node.js 20 환경에 기본 내장된 `fetch` API만을 사용하여 `scripts/collect-dora.js`를 구현합니다.

## 3. 기대 효과 및 트레이드오프 (Consequences)
- **장점**: `npm install` 없이 즉시 실행 가능하여 CI 실행 시간을 단축하고 보안 취약점 노출을 최소화합니다.
- **단점**: 페이지네이션 및 Rate Limit 재시도 로직을 직접 코드로 제어해야 합니다.
