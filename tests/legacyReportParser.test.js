const { parseLegacyPrReport } = require('../src/legacyReportParser');

describe('Legacy Report Parser Characterization & Refactoring Stability', () => {
  test('parses valid rows, ignores comments/malformed lines, and classifies risk levels', () => {
    const csv = [
      '# legacy export header',
      'PR-101, 120, 2',
      'PR-102, 300, 1',
      'PR-103, 350, 0',
      'PR-104, 650, 2',
      'PR-105, 800, 0',
      'broken-line-without-commas',
      'PR-106, -50, bad'
    ].join('\n');

    const result = parseLegacyPrReport(csv);
    expect(result.items).toEqual([
      { id: 'PR-101', changedLines: 120, reviewers: 2, risk: 'LOW' },
      { id: 'PR-102', changedLines: 300, reviewers: 1, risk: 'MEDIUM' },
      { id: 'PR-103', changedLines: 350, reviewers: 0, risk: 'HIGH' },
      { id: 'PR-104', changedLines: 650, reviewers: 2, risk: 'HIGH' },
      { id: 'PR-105', changedLines: 800, reviewers: 0, risk: 'CRITICAL' },
      { id: 'PR-106', changedLines: 0, reviewers: 0, risk: 'LOW' }
    ]);
    expect(result.highRiskCount).toBe(3);
    expect(result.totalLines).toBe(2220);
  });

  test('returns empty summary for empty or null input', () => {
    expect(parseLegacyPrReport('')).toEqual({ items: [], highRiskCount: 0, totalLines: 0 });
    expect(parseLegacyPrReport(null)).toEqual({ items: [], highRiskCount: 0, totalLines: 0 });
  });
});
