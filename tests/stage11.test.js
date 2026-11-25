const { evaluateFlag, evaluateAllFlags } = require('../src/featureFlags');
const { assignVariant, trackEvent, summarizeEvents } = require('../src/abTest');
const { executeCanaryRollout } = require('../src/canaryRollout');

describe('Stage 11: Feature Flags, A/B Testing & Canary Rollout', () => {
  test('Feature Flags support env overrides and target user targeting', () => {
    const allDefault = evaluateAllFlags({ userId: 'regular-user', env: {} });
    expect(Object.keys(allDefault).length).toBeGreaterThanOrEqual(3);

    const envOn = evaluateFlag('enableStrictCommitGate', {
      userId: 'regular-user',
      env: { FF_STRICT_COMMIT_GATE: 'true' }
    });
    expect(envOn.enabled).toBe(true);
    expect(envOn.reason).toBe('env:FF_STRICT_COMMIT_GATE');

    const envOff = evaluateFlag('enableSmartPrSummary', {
      userId: 'rkdtks1446-ui',
      env: { FF_SMART_PR_SUMMARY: 'false' }
    });
    expect(envOff.enabled).toBe(false);

    const targetHit = evaluateFlag('enableDoraAnomalyAlert', {
      userId: 'sre-oncall',
      env: {}
    });
    expect(targetHit.enabled).toBe(true);
    expect(targetHit.reason).toBe('target_user');
  });

  test('A/B test assigns consistent variants per user and summarizes events', () => {
    const first = assignVariant('user-consistency-42');
    for (let i = 0; i < 15; i += 1) {
      expect(assignVariant('user-consistency-42').variant).toBe(first.variant);
    }

    const events = [
      trackEvent({ userId: 'u1', eventType: 'exposure' }),
      trackEvent({ userId: 'u1', eventType: 'review_completed' }),
      trackEvent({ userId: 'u2', eventType: 'exposure' })
    ];
    const summary = summarizeEvents(events);
    expect(summary.A.exposures + summary.B.exposures).toBe(2);
    expect(summary.A.conversions + summary.B.conversions).toBe(1);
  });

  test('Canary rollout promotes 1%-10%-50%-100% when healthy', () => {
    const result = executeCanaryRollout(() => ({
      healthStatus: 'ok',
      errorRate: 0.01,
      p95LatencyMs: 140
    }));
    expect(result.status).toBe('COMPLETED');
    expect(result.activeTrafficPercent).toBe(100);
    expect(result.history.map((h) => h.stagePercent)).toEqual([1, 10, 50, 100]);
  });

  test('Canary rollout automatically rolls back to 0% on healthcheck failure at 50%', () => {
    const result = executeCanaryRollout((stage) => (
      stage === 50
        ? { healthStatus: 'degraded', errorRate: 0.12, p95LatencyMs: 520 }
        : { healthStatus: 'ok', errorRate: 0.01, p95LatencyMs: 130 }
    ));
    expect(result.status).toBe('ROLLED_BACK');
    expect(result.failedAtStage).toBe(50);
    expect(result.activeTrafficPercent).toBe(0);
    expect(result.activeVersion).toBe('1.1.0');
  });
});
