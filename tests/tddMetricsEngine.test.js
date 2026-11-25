const {
  calculateDeploymentFrequency,
  calculateLeadTimeHours,
  calculateChangeFailureRate,
  calculateMttrMinutes,
  evaluateReleaseReadiness
} = require('../src/tddMetricsEngine');

describe('TDD Core Features (5 DORA & Release Gate Functions)', () => {
  test('1. calculateDeploymentFrequency computes weekly rate and DORA tier', () => {
    expect(calculateDeploymentFrequency(14, 7)).toEqual({ perWeek: 14, tier: 'Elite' });
    expect(calculateDeploymentFrequency(4, 7)).toEqual({ perWeek: 4, tier: 'High' });
    expect(calculateDeploymentFrequency(1, 7)).toEqual({ perWeek: 1, tier: 'Medium' });
    expect(calculateDeploymentFrequency(0, 7)).toEqual({ perWeek: 0, tier: 'Low' });
    expect(() => calculateDeploymentFrequency(3, 0)).toThrow('periodDays must be positive');
  });

  test('2. calculateLeadTimeHours returns median hours and ignores invalid records', () => {
    const changes = [
      { committedAt: '2026-11-01T00:00:00Z', deployedAt: '2026-11-01T02:00:00Z' },
      { committedAt: '2026-11-02T00:00:00Z', deployedAt: '2026-11-02T06:00:00Z' },
      { committedAt: '2026-11-03T00:00:00Z', deployedAt: '2026-11-03T04:00:00Z' },
      { committedAt: '2026-11-04T05:00:00Z', deployedAt: '2026-11-04T01:00:00Z' }
    ];
    expect(calculateLeadTimeHours(changes)).toBe(4);
    expect(calculateLeadTimeHours(changes.slice(0, 2))).toBe(4);
    expect(calculateLeadTimeHours([])).toBe(0);
  });

  test('3. calculateChangeFailureRate calculates percentage and SLA breach flag', () => {
    expect(calculateChangeFailureRate([{ failed: false }, { failed: true }, { failed: false }, { failed: false }]))
      .toEqual({ total: 4, failed: 1, ratePercent: 25, slaBreached: true });
    expect(calculateChangeFailureRate([{ failed: false }, { failed: false }]))
      .toEqual({ total: 2, failed: 0, ratePercent: 0, slaBreached: false });
    expect(calculateChangeFailureRate([]))
      .toEqual({ total: 0, failed: 0, ratePercent: 0, slaBreached: false });
  });

  test('4. calculateMttrMinutes computes average recovery time in minutes', () => {
    const incidents = [
      { detectedAt: '2026-11-01T10:00:00Z', resolvedAt: '2026-11-01T10:30:00Z' },
      { detectedAt: '2026-11-02T10:00:00Z', resolvedAt: '2026-11-02T11:00:00Z' }
    ];
    expect(calculateMttrMinutes(incidents)).toBe(45);
    expect(calculateMttrMinutes([])).toBe(0);
  });

  test('5. evaluateReleaseReadiness determines READY or BLOCKED with reasons', () => {
    expect(evaluateReleaseReadiness({
      coveragePercent: 88,
      failureRatePercent: 5,
      criticalVulns: 0,
      testsPassed: true
    })).toEqual({ status: 'READY', blockers: [] });

    const blocked = evaluateReleaseReadiness({
      coveragePercent: 72,
      failureRatePercent: 20,
      criticalVulns: 2,
      testsPassed: false
    });
    expect(blocked.status).toBe('BLOCKED');
    expect(blocked.blockers).toHaveLength(4);
  });
});
