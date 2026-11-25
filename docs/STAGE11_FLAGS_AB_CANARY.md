# 11단계: Feature Flag, A/B 테스트 및 Canary 자동 롤백 검증 리포트

## 1. Feature Flag 4종 및 토글 제어 우선순위
- **설정 파일**: [`config/feature-flags.json`](../config/feature-flags.json)
- **평가 엔진**: [`src/featureFlags.js`](../src/featureFlags.js) / API 엔드포인트: `GET /api/flags?userId=<id>`
- **제어 우선순위**: `1) 환경 변수(FF_*) 오버라이드` → `2) 대상 사용자(targetUsers) 화이트리스트` → `3) 점진적 롤아웃 비율(%)` → `4) 기본값`

| Flag Key | 환경 변수 | 대상 사용자 | 기본 상태 |
| :--- | :--- | :--- | :---: |
| `enableSmartPrSummary` | `FF_SMART_PR_SUMMARY` | `rkdtks1446-ui`, `beta-reviewer-1` | ON (100%) |
| `enableStrictCommitGate` | `FF_STRICT_COMMIT_GATE` | `qa-lead`, `release-bot` | OFF (0%) |
| `enableDoraAnomalyAlert` | `FF_DORA_ANOMALY_ALERT` | `sre-oncall`, `rkdtks1446-ui` | 25% 롤아웃 |
| `enableCompactDashboardUi` | `FF_COMPACT_DASHBOARD_UI` | `ux-tester-1` | 50% 롤아웃 |

## 2. A/B 테스트 (2개 Variant) 일관성 할당 및 이벤트 추적
- **실험 코드**: [`src/abTest.js`](../src/abTest.js) / API 엔드포인트: `GET /api/experiment?userId=<id>&event=exposure`
- **할당 일관성**: `SHA-256(experimentId:userId) % 100` 결정적 버킷팅으로 동일 사용자는 재방문 시에도 항상 동일한 Variant(`A` 또는 `B`)에 할당됩니다.
- **실험 로그**: [`logs/experiment-events.jsonl`](../logs/experiment-events.jsonl) | [`logs/ab-test-summary.json`](../logs/ab-test-summary.json)

## 3. Canary 1%-10%-50%-100% 롤아웃 및 헬스체크 자동 롤백
- **롤아웃 설정 및 엔진**: [`config/canary-rollout.json`](../config/canary-rollout.json) | [`src/canaryRollout.js`](../src/canaryRollout.js)
- **헬스체크 임계값**: `healthStatus === 'ok'`, `errorRate <= 5%`, `p95LatencyMs <= 300ms`
- **검증 시나리오 결과** ([`logs/canary-rollout-log.json`](../logs/canary-rollout-log.json)):
  1. **정상 승격**: `1% → 10% → 50% → 100%` 전 단계 통과 (`COMPLETED`, `1.2.0-canary` 활성화)
  2. **자동 롤백**: `50%` 단계에서 에러율 `14%`, 지연 `680ms` 감지 시 즉시 승격 중단 및 트래픽 `0%` 회수 (`ROLLED_BACK`, 안정 버전 `1.1.0` 복구)
- **CI 자동 검증 워크플로우**: [`.github/workflows/canary-rollout.yml`](../.github/workflows/canary-rollout.yml)
