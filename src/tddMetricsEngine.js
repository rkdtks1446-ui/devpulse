const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const THRESHOLDS = {
  ELITE_PER_WEEK: 7,
  HIGH_PER_WEEK: 3,
  MEDIUM_PER_WEEK: 1,
  MAX_CFR_PERCENT: 15,
  MIN_COVERAGE_PERCENT: 80
};

function round2(value) {
  return Number(value.toFixed(2));
}

function extractValidDurations(records, startKey, endKey, divisorMs) {
  if (!Array.isArray(records)) return [];
  return records
    .map((item) => (new Date(item[endKey]) - new Date(item[startKey])) / divisorMs)
    .filter((val) => Number.isFinite(val) && val >= 0);
}

function resolveFrequencyTier(perWeek) {
  if (perWeek >= THRESHOLDS.ELITE_PER_WEEK) return 'Elite';
  if (perWeek >= THRESHOLDS.HIGH_PER_WEEK) return 'High';
  if (perWeek >= THRESHOLDS.MEDIUM_PER_WEEK) return 'Medium';
  return 'Low';
}

function calculateDeploymentFrequency(deployCount, periodDays = 7) {
  if (typeof periodDays !== 'number' || periodDays <= 0) {
    throw new Error('periodDays must be positive');
  }
  const safeCount = Math.max(0, Number(deployCount) || 0);
  const perWeek = round2((safeCount / periodDays) * 7);
  return { perWeek, tier: resolveFrequencyTier(perWeek) };
}

function calculateLeadTimeHours(changes = []) {
  const sorted = extractValidDurations(changes, 'committedAt', 'deployedAt', MS_PER_HOUR).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return round2(median);
}

function calculateChangeFailureRate(deployments = []) {
  const total = Array.isArray(deployments) ? deployments.length : 0;
  if (total === 0) return { total: 0, failed: 0, ratePercent: 0, slaBreached: false };
  const failed = deployments.filter((d) => Boolean(d.failed)).length;
  const ratePercent = round2((failed / total) * 100);
  return { total, failed, ratePercent, slaBreached: ratePercent > THRESHOLDS.MAX_CFR_PERCENT };
}

function calculateMttrMinutes(incidents = []) {
  const durations = extractValidDurations(incidents, 'detectedAt', 'resolvedAt', MS_PER_MINUTE);
  if (durations.length === 0) return 0;
  const sum = durations.reduce((acc, cur) => acc + cur, 0);
  return round2(sum / durations.length);
}

function evaluateReleaseReadiness(summary = {}) {
  const checks = [
    { failed: !summary.testsPassed, reason: 'Unit tests failed' },
    { failed: (summary.coveragePercent || 0) < THRESHOLDS.MIN_COVERAGE_PERCENT, reason: 'Coverage below 80%' },
    { failed: (summary.failureRatePercent || 0) > THRESHOLDS.MAX_CFR_PERCENT, reason: 'Change failure rate above 15%' },
    { failed: (summary.criticalVulns || 0) > 0, reason: 'Critical security vulnerabilities found' }
  ];
  const blockers = checks.filter((c) => c.failed).map((c) => c.reason);
  return { status: blockers.length === 0 ? 'READY' : 'BLOCKED', blockers };
}

module.exports = {
  calculateDeploymentFrequency,
  calculateLeadTimeHours,
  calculateChangeFailureRate,
  calculateMttrMinutes,
  evaluateReleaseReadiness
};
