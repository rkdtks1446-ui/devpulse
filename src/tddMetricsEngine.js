function calculateDeploymentFrequency(deployCount, periodDays = 7) {
  if (typeof periodDays !== 'number' || periodDays <= 0) throw new Error('periodDays must be positive');
  const count = Math.max(0, Number(deployCount) || 0);
  const perWeek = Number(((count / periodDays) * 7).toFixed(2));
  let tier = 'Low';
  if (perWeek >= 7) tier = 'Elite';
  else if (perWeek >= 3) tier = 'High';
  else if (perWeek >= 1) tier = 'Medium';
  return { perWeek, tier };
}

function calculateLeadTimeHours(changes = []) {
  const durations = changes
    .map((c) => (new Date(c.deployedAt) - new Date(c.committedAt)) / 3600000)
    .filter((h) => Number.isFinite(h) && h >= 0)
    .sort((a, b) => a - b);
  if (durations.length === 0) return 0;
  const mid = Math.floor(durations.length / 2);
  const median = durations.length % 2 === 1 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
  return Number(median.toFixed(2));
}

function calculateChangeFailureRate(deployments = []) {
  const total = deployments.length;
  if (total === 0) return { total: 0, failed: 0, ratePercent: 0, slaBreached: false };
  const failed = deployments.filter((d) => Boolean(d.failed)).length;
  const ratePercent = Number(((failed / total) * 100).toFixed(2));
  return { total, failed, ratePercent, slaBreached: ratePercent > 15 };
}

function calculateMttrMinutes(incidents = []) {
  const mins = incidents
    .map((inc) => (new Date(inc.resolvedAt) - new Date(inc.detectedAt)) / 60000)
    .filter((m) => Number.isFinite(m) && m >= 0);
  if (mins.length === 0) return 0;
  const avg = mins.reduce((sum, v) => sum + v, 0) / mins.length;
  return Number(avg.toFixed(2));
}

function evaluateReleaseReadiness(summary = {}) {
  const blockers = [];
  if (!summary.testsPassed) blockers.push('Unit tests failed');
  if ((summary.coveragePercent || 0) < 80) blockers.push('Coverage below 80%');
  if ((summary.failureRatePercent || 0) > 15) blockers.push('Change failure rate above 15%');
  if ((summary.criticalVulns || 0) > 0) blockers.push('Critical security vulnerabilities found');
  return { status: blockers.length === 0 ? 'READY' : 'BLOCKED', blockers };
}

module.exports = {
  calculateDeploymentFrequency,
  calculateLeadTimeHours,
  calculateChangeFailureRate,
  calculateMttrMinutes,
  evaluateReleaseReadiness
};
