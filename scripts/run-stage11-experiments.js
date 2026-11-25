const fs = require('fs');
const path = require('path');
const { evaluateAllFlags } = require('../src/featureFlags');
const { assignVariant, trackEvent, summarizeEvents } = require('../src/abTest');
const { executeCanaryRollout } = require('../src/canaryRollout');

const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

// 1) Feature Flag 평가 로그 (환경 변수 및 대상 사용자 기준)
const flagSnapshots = {
  generatedAt: new Date().toISOString(),
  targetUserEvaluation: evaluateAllFlags({ userId: 'sre-oncall', env: {} }),
  envOverrideEvaluation: evaluateAllFlags({
    userId: 'normal-user',
    env: { FF_STRICT_COMMIT_GATE: 'true', FF_SMART_PR_SUMMARY: 'false' }
  })
};
fs.writeFileSync(path.join(logsDir, 'feature-flags-log.json'), JSON.stringify(flagSnapshots, null, 2));

// 2) A/B 테스트 40명 일관성 할당 및 이벤트 추적 로그
const eventLogPath = path.join(logsDir, 'experiment-events.jsonl');
fs.writeFileSync(eventLogPath, '', 'utf8');
const events = [];
let consistencyPassed = true;

for (let i = 1; i <= 40; i += 1) {
  const userId = `dev-user-${String(i).padStart(2, '0')}`;
  const first = assignVariant(userId);
  const second = assignVariant(userId);
  if (first.variant !== second.variant) consistencyPassed = false;

  events.push(trackEvent({ userId, eventType: 'exposure', logFilePath: eventLogPath }));
  const converted = first.variant === 'B' ? i % 5 !== 0 : i % 3 !== 0;
  if (converted) {
    events.push(trackEvent({
      userId,
      eventType: 'review_completed',
      metadata: { durationSec: first.variant === 'B' ? 140 : 210 },
      logFilePath: eventLogPath
    }));
  }
}

const abSummary = {
  generatedAt: new Date().toISOString(),
  totalUsers: 40,
  assignmentConsistencyPassed: consistencyPassed,
  metrics: summarizeEvents(events)
};
fs.writeFileSync(path.join(logsDir, 'ab-test-summary.json'), JSON.stringify(abSummary, null, 2));

// 3) Canary 1%-10%-50%-100% 정상 승격 및 50% 장애 자동 롤백 시나리오 검증
const healthyRollout = executeCanaryRollout((stage) => ({
  healthStatus: 'ok',
  errorRate: 0.008 + stage * 0.0001,
  p95LatencyMs: 120 + stage * 0.4
}));

const rollbackRollout = executeCanaryRollout((stage) => {
  if (stage === 50) {
    return { healthStatus: 'degraded', errorRate: 0.14, p95LatencyMs: 680 };
  }
  return { healthStatus: 'ok', errorRate: 0.01, p95LatencyMs: 130 };
});

const canaryLog = {
  generatedAt: new Date().toISOString(),
  scenarios: {
    progressivePromotion: healthyRollout,
    healthcheckAutoRollback: rollbackRollout
  }
};
fs.writeFileSync(path.join(logsDir, 'canary-rollout-log.json'), JSON.stringify(canaryLog, null, 2));

console.log('Stage 11 experiment & canary logs generated:', {
  consistencyPassed,
  abMetrics: abSummary.metrics,
  healthyStatus: healthyRollout.status,
  rollbackStatus: rollbackRollout.status,
  rollbackStage: rollbackRollout.failedAtStage
});
