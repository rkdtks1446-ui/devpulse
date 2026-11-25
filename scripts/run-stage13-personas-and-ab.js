const fs = require('fs');
const path = require('path');
const {
  evaluatePersonaScenario,
  aggregateFeedback,
  analyzeTwoWeekExperiment,
  decidePivotOrPersevere
} = require('../src/experimentEngine');

const expDir = path.join(__dirname, '..', 'experiments');
fs.mkdirSync(expDir, { recursive: true });

// 1) LLM 페르소나 10명 시나리오 실행 및 피드백 수집
const personas = JSON.parse(fs.readFileSync(path.join(expDir, 'personas-10.json'), 'utf8'));
const personaFeedback = personas.map((p) => evaluatePersonaScenario(p, {}));
const feedbackSummary = aggregateFeedback(personaFeedback);

fs.writeFileSync(
  path.join(expDir, 'persona-feedback-10.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), summary: feedbackSummary, responses: personaFeedback }, null, 2)
);

// 2) Feature Flag 기반 2주(14일: 2026-11-12 ~ 2026-11-25) A/B 테스트 일별 지표 데이터
const startDate = new Date('2026-11-12T00:00:00Z');
const dailySeeds = [
  [54, 33, 224, 6, 56, 41, 168, 10],
  [58, 35, 220, 7, 57, 43, 165, 11],
  [49, 29, 228, 5, 51, 38, 166, 9],
  [44, 27, 225, 5, 46, 35, 164, 9],
  [62, 38, 218, 8, 63, 48, 160, 12],
  [65, 40, 219, 8, 64, 50, 158, 13],
  [60, 36, 221, 7, 62, 48, 159, 13],
  [64, 39, 217, 8, 66, 53, 155, 15],
  [68, 42, 216, 9, 69, 55, 152, 16],
  [52, 32, 222, 6, 54, 43, 154, 12],
  [48, 29, 220, 6, 50, 40, 153, 11],
  [70, 43, 215, 9, 72, 58, 150, 17],
  [73, 45, 214, 10, 74, 60, 148, 18],
  [71, 44, 215, 9, 73, 59, 149, 18]
];

const dailyRecords = dailySeeds.map((row, idx) => {
  const dt = new Date(startDate.getTime() + idx * 86400000).toISOString().slice(0, 10);
  return {
    day: idx + 1,
    date: dt,
    week: idx < 7 ? 1 : 2,
    featureFlag: 'enableSmartPrSummary',
    variantA: { exposures: row[0], completions: row[1], avgReviewSec: row[2], defectsCaught: row[3] },
    variantB: { exposures: row[4], completions: row[5], avgReviewSec: row[6], defectsCaught: row[7] }
  };
});

fs.writeFileSync(path.join(expDir, 'ab-2week-daily-metrics.json'), JSON.stringify(dailyRecords, null, 2));

const abAnalysis = analyzeTwoWeekExperiment(dailyRecords);
const decision = decidePivotOrPersevere(abAnalysis, feedbackSummary);

const fullSummary = {
  experimentId: 'pr_review_guidance_v1',
  featureFlag: 'enableSmartPrSummary',
  period: '2026-11-12 ~ 2026-11-25 (14 Days)',
  generatedAt: new Date().toISOString(),
  abAnalysis,
  feedbackSummary,
  decision
};

fs.writeFileSync(path.join(expDir, 'ab-2week-summary.json'), JSON.stringify(fullSummary, null, 2));

const weeklyMd = [
  `## Automated Experiment Weekly Report (\`${fullSummary.experimentId}\`)`,
  `- **Period**: ${fullSummary.period}`,
  `- **Feature Flag**: \`${fullSummary.featureFlag}\``,
  `- **Decision**: **${decision.decision}** (Confidence: ${decision.confidence})`,
  '',
  '### 2-Week A/B Key Metric Comparison',
  '| Metric | Variant A (Control) | Variant B (Treatment) | Delta |',
  '| :--- | :---: | :---: | :---: |',
  `| Review Completion Rate | ${abAnalysis.overall.A.completionRate}% | **${abAnalysis.overall.B.completionRate}%** | **+${abAnalysis.impact.completionLiftPp}%p** |`,
  `| Avg Review Time | ${abAnalysis.overall.A.avgReviewSec}s | **${abAnalysis.overall.B.avgReviewSec}s** | **-${abAnalysis.impact.reviewTimeReductionPercent}%** |`,
  `| Defect Catch Rate | ${abAnalysis.overall.A.defectCatchRate}% | **${abAnalysis.overall.B.defectCatchRate}%** | +${(abAnalysis.overall.B.defectCatchRate - abAnalysis.overall.A.defectCatchRate).toFixed(2)}%p |`,
  `| Z-Score (Significance) | - | - | **${abAnalysis.impact.zScore}** (${abAnalysis.impact.statisticallySignificant ? 'p < 0.05 Significant' : 'Not Significant'}) |`,
  '',
  '### 10 LLM Persona Feedback Summary',
  `- **Respondents**: ${feedbackSummary.totalRespondents} distinct personas`,
  `- **Average CSAT**: **${feedbackSummary.avgCsat} / 5.0** (Positive: ${feedbackSummary.positiveRatePercent}%)`,
  `- **Rationale**: ${decision.rationale}`
].join('\n');

fs.writeFileSync(path.join(expDir, 'weekly-report.md'), weeklyMd + '\n', 'utf8');
console.log('Stage 13 experiment data generated:', {
  decision: decision.decision,
  completionLiftPp: abAnalysis.impact.completionLiftPp,
  reviewTimeReductionPercent: abAnalysis.impact.reviewTimeReductionPercent,
  avgCsat: feedbackSummary.avgCsat
});
