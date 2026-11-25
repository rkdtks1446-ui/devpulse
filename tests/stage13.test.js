const fs = require('fs');
const path = require('path');
const {
  evaluatePersonaScenario,
  aggregateFeedback,
  analyzeTwoWeekExperiment,
  decidePivotOrPersevere
} = require('../src/experimentEngine');

describe('Stage 13: LLM Persona Evaluation, 2-Week A/B Analysis & Pivot/Persevere Engine', () => {
  const personas = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'experiments', 'personas-10.json'), 'utf8')
  );

  test('evaluates 10 distinct LLM personas and aggregates feedback accurately', () => {
    expect(personas).toHaveLength(10);
    const roles = new Set(personas.map((p) => p.role));
    expect(roles.size).toBe(10);

    const results = personas.map((p) => evaluatePersonaScenario(p, {}));
    const summary = aggregateFeedback(results);
    expect(summary.totalRespondents).toBe(10);
    expect(summary.avgCsat).toBeGreaterThanOrEqual(3.5);
    expect(summary.byVariant.A.count + summary.byVariant.B.count).toBe(10);

    const strictFail = evaluatePersonaScenario(personas[6], { FF_STRICT_COMMIT_GATE: 'true' });
    expect(strictFail.scenarioResult.commitValid).toBe(false);

    expect(aggregateFeedback([]).totalRespondents).toBe(0);
  });

  test('analyzes 14-day A/B metrics and determines PERSEVERE / ITERATE / PIVOT', () => {
    const daily = Array.from({ length: 14 }, (_, idx) => ({
      day: idx + 1,
      variantA: { exposures: 100, completions: 60, avgReviewSec: 220, defectsCaught: 12 },
      variantB: { exposures: 100, completions: 78, avgReviewSec: 155, defectsCaught: 21 }
    }));

    const analysis = analyzeTwoWeekExperiment(daily);
    expect(analysis.daysObserved).toBe(14);
    expect(analysis.impact.completionLiftPp).toBe(18);
    expect(analysis.impact.reviewTimeReductionPercent).toBeGreaterThan(25);
    expect(analysis.impact.statisticallySignificant).toBe(true);

    expect(decidePivotOrPersevere(analysis, { avgCsat: 4.3 }).decision).toBe('PERSEVERE');
    expect(decidePivotOrPersevere(
      { impact: { completionLiftPp: 4, reviewTimeReductionPercent: 8, statisticallySignificant: false } },
      { avgCsat: 3.6 }
    ).decision).toBe('ITERATE');
    expect(decidePivotOrPersevere(
      { impact: { completionLiftPp: -3, reviewTimeReductionPercent: -5, statisticallySignificant: false } },
      { avgCsat: 2.5 }
    ).decision).toBe('PIVOT');

    const emptyAnalysis = analyzeTwoWeekExperiment([]);
    expect(emptyAnalysis.overall.A.completionRate).toBe(0);
  });
});
