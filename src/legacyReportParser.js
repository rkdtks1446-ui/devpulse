const LARGE_PR_LIMIT = 500;
const MEDIUM_PR_LIMIT = 200;
const HIGH_RISK_LEVELS = new Set(['HIGH', 'CRITICAL']);

function toNonNegativeInt(rawValue) {
  const parsed = Number.parseInt(String(rawValue).trim(), 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function classifyRisk(changedLines, reviewers) {
  if (changedLines > LARGE_PR_LIMIT && reviewers === 0) return 'CRITICAL';
  if (changedLines > LARGE_PR_LIMIT || (changedLines > MEDIUM_PR_LIMIT && reviewers === 0)) return 'HIGH';
  if (changedLines > MEDIUM_PR_LIMIT) return 'MEDIUM';
  return 'LOW';
}

function parseRow(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const parts = trimmed.split(',');
  if (parts.length < 3) return null;

  const id = parts[0].trim();
  const changedLines = toNonNegativeInt(parts[1]);
  const reviewers = toNonNegativeInt(parts[2]);
  return { id, changedLines, reviewers, risk: classifyRisk(changedLines, reviewers) };
}

function parseLegacyPrReport(raw) {
  if (!raw) return { items: [], highRiskCount: 0, totalLines: 0 };

  const items = String(raw).split('\n').map(parseRow).filter(Boolean);
  const highRiskCount = items.filter((item) => HIGH_RISK_LEVELS.has(item.risk)).length;
  const totalLines = items.reduce((sum, item) => sum + item.changedLines, 0);

  return { items, highRiskCount, totalLines };
}

module.exports = { parseLegacyPrReport, classifyRisk, parseRow };
