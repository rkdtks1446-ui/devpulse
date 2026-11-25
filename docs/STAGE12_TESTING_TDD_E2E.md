# 12단계: Jest 80%+ 커버리지, TDD 5개 핵심 기능, Playwright E2E 및 레거시 리팩토링 리포트

## 1. Jest 단위 테스트 80% 이상 커버리지 및 CI 자동 게이트
- **설정 파일**: [`jest.config.js`](../jest.config.js) (`statements`, `branches`, `functions`, `lines` 전 항목 `>= 80%` 강제)
- **CI 자동 실행**: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) → `reusable-test.yml`에서 `ubuntu-latest`/`windows-latest` × Node `18`/`20` 매트릭스로 `npm test` 자동 검증

## 2. TDD (Red → Green → Refactor) 핵심 기능 5종 구현
- **구현 모듈**: [`src/tddMetricsEngine.js`](../src/tddMetricsEngine.js) | **테스트**: [`tests/tddMetricsEngine.test.js`](../tests/tddMetricsEngine.test.js)
- **커밋 이력 증명**: `[RED]` 실패 테스트 커밋 → `[GREEN]` 최소 구현 통과 커밋 → `[REFACTOR]` 공용 헬퍼·임계값 상수 추출 커밋

| # | 핵심 기능 | 검증 범위 |
| :---: | :--- | :--- |
| 1 | `calculateDeploymentFrequency` | 주간 배포 빈도 산출 및 DORA 등급(`Elite`/`High`/`Medium`/`Low`) 판정 |
| 2 | `calculateLeadTimeHours` | 커밋-배포 간 중앙값 리드 타임 계산 및 역전/비정상 타임스탬프 필터링 |
| 3 | `calculateChangeFailureRate` | 변경 실패율(%) 계산 및 15% SLA 초과 감지 |
| 4 | `calculateMttrMinutes` | 장애 감지-복구 평균 시간(분) 산출 |
| 5 | `evaluateReleaseReadiness` | 커버리지·실패율·취약점·테스트 결과 종합 `READY`/`BLOCKED` 릴리스 게이트 |

## 3. 레거시 코드 테스트 보강 및 리팩토링 안정성 검증
- **대상 모듈**: [`src/legacyReportParser.js`](../src/legacyReportParser.js) | **특성 테스트**: [`tests/legacyReportParser.test.js`](../tests/legacyReportParser.test.js)
- **검증 절차**: 기존 레거시 파서(`var`, 중복 분기, 매직 넘버)에 8종 경계 케이스 특성 테스트를 먼저 추가해 동작을 고정한 뒤, `toNonNegativeInt`·`classifyRisk`·`parseRow` 순수 함수로 리팩토링하여 회귀 0건으로 모든 테스트 통과를 검증했습니다.

## 4. Playwright E2E 시나리오 및 실패 시 스크린샷 아티팩트 저장
- **설정 및 시나리오**: [`playwright.config.js`](../playwright.config.js) (`screenshot: 'only-on-failure'`) | [`e2e/dashboard.spec.js`](../e2e/dashboard.spec.js)
- **CI 워크플로우**: [`.github/workflows/e2e-playwright.yml`](../.github/workflows/e2e-playwright.yml) — 정상 E2E 통과와 함께 실패 시 `test-results/` 내 실제 PNG 스크린샷을 **`playwright-failure-screenshots`** 아티팩트로 자동 업로드합니다.
