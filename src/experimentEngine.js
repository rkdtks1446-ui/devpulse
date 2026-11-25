const { evaluateAllFlags } = require('./featureFlags');
const { assignVariant } = require('./abTest');
const { classifyPrSize } = require('./prSizeAnalyzer');
const { validateCommitMessage } = require('./commitValidator');

function evaluatePersonaScenario(persona, env = {}) {
  const flags = evaluateAllFlags({ userId: persona.userId, env });
  const assignment = assignVariant(persona.userId);
  const prSize = classifyPrSize(persona.scenario.changedLines);
  const commitValid = validateCommitMessage(persona.scenario.commitMessage);

  const isTreatment = assignment.variant === 'B';
  const baseScore = persona.baseSatisfaction;
  const variantBoost = isTreatment ? persona.treatmentLiftScore : 0;
  const strictPenalty = flags.enableStrictCommitGate.enabled && !commitValid ? -0.5 : 0;
  const csatScore = Number(Math.min(5, Math.max(1, baseScore + variantBoost + strictPenalty)).toFixed(1));

  const reviewTimeSec = Math.round(
    persona.scenario.baselineReviewSec * (isTreatment ? 0.72 : 1.0)
  );

  return {
    personaId: persona.id,
    userId: persona.userId,
    role: persona.role,
    pattern: persona.behaviorPattern,
    llmPromptUsed: persona.llmSystemPrompt,
    assignedVariant: assignment.variant,
    variantName: assignment.variantName,
    activeFlags: Object.keys(flags).filter((k) => flags[k].enabled),
    scenarioResult: {
      prSize,
      commitValid,
      reviewTimeSec
    },
    csatScore,
    sentiment: csatScore >= 4.0 ? 'positive' : csatScore >= 3.0 ? 'neutral' : 'negative',
    feedbackComment: isTreatment ? persona.feedbackByVariant.B : persona.feedbackByVariant.A,
    painPoint: persona.painPoint
  };
}

function aggregateFeedback(feedbackList = []) {
  if (!Array.isArray(feedbackList) || feedbackList.length === 0) {
    return {
      totalRespondents: 0,
      avgCsat: 0,
      positiveRatePercent: 0,
      byVariant: { A: { count: 0, avgCsat: 0 }, B: { count: 0, avgCsat: 0 } }
    };
  }

  const total = feedbackList.length;
  const avgCsat = Number(
    (feedbackList.reduce((acc, f) => acc + f.csatScore, 0) / total).toFixed(2)
  );
  const positiveCount = feedbackList.filter((f) => f.sentiment === 'positive').length;

  const byVariant = { A: { count: 0, avgCsat: 0 }, B: { count: 0, avgCsat: 0 } };
  for (const v of ['A', 'B']) {
    const group = feedbackList.filter((f) => f.assignedVariant === v);
    byVariant[v].count = group.length;
    byVariant[v].avgCsat = group.length > 0
      ? Number((group.reduce((s, item) => s + item.csatScore, 0) / group.length).toFixed(2))
      : 0;
  }

  return {
    totalRespondents: total,
    avgCsat,
    positiveRatePercent: Number(((positiveCount / total) * 100).toFixed(1)),
    byVariant
  };
}

function summarizeVariantGroup(dailyRecords, key) {
  let exposures = 0;
  let completions = 0;
  let weightedDuration = 0;
  let defectsCaught = 0;

  for (const day of dailyRecords) {
    const g = day[key];
    exposures += g.exposures;
    completions += g.completions;
    weightedDuration += g.avgReviewSec * g.completions;
    defectsCaught += g.defectsCaught;
  }

  const completionRate = exposures > 0 ? Number(((completions / exposures) * 100).toFixed(2)) : 0;
  const avgReviewSec = completions > 0 ? Number((weightedDuration / completions).toFixed(1)) : 0;
  const defectCatchRate = completions > 0 ? Number(((defectsCaught / completions) * 100).toFixed(2)) : 0;

  return { exposures, completions, completionRate, avgReviewSec, defectsCaught, defectCatchRate };
}

function analyzeTwoWeekExperiment(dailyRecords = []) {
  const week1 = dailyRecords.slice(0, 7);
  const week2 = dailyRecords.slice(7, 14);

  const totalA = summarizeVariantGroup(dailyRecords, 'variantA');
  const totalB = summarizeVariantGroup(dailyRecords, 'variantB');

  const completionLiftPp = Number((totalB.completionRate - totalA.completionRate).toFixed(2));
  const reviewTimeReductionPercent = totalA.avgReviewSec > 0
    ? Number((((totalA.avgReviewSec - totalB.avgReviewSec) / totalA.avgReviewSec) * 100).toFixed(2))
    : 0;

  const pA = totalA.exposures > 0 ? totalA.completions / totalA.exposures : 0;
  const pB = totalB.exposures > 0 ? totalB.completions / totalB.exposures : 0;
  const pooled = (totalA.exposures + totalB.exposures) > 0
    ? (totalA.completions + totalB.completions) / (totalA.exposures + totalB.exposures)
    : 0;
  const se = pooled > 0 && pooled < 1
    ? Math.sqrt(pooled * (1 - pooled) * (1 / totalA.exposures + 1 / totalB.exposures))
    : 0;
  const zScore = se > 0 ? Number(((pB - pA) / se).toFixed(2)) : 0;

  return {
    daysObserved: dailyRecords.length,
    week1: {
      A: summarizeVariantGroup(week1, 'variantA'),
      B: summarizeVariantGroup(week1, 'variantB')
    },
    week2: {
      A: summarizeVariantGroup(week2, 'variantA'),
      B: summarizeVariantGroup(week2, 'variantB')
    },
    overall: { A: totalA, B: totalB },
    impact: {
      completionLiftPp,
      reviewTimeReductionPercent,
      zScore,
      statisticallySignificant: Math.abs(zScore) >= 1.96
    }
  };
}

function decidePivotOrPersevere(experimentSummary, feedbackSummary) {
  const { completionLiftPp, reviewTimeReductionPercent, statisticallySignificant } = experimentSummary.impact;
  const avgCsat = feedbackSummary.avgCsat;

  if (statisticallySignificant && completionLiftPp >= 10 && reviewTimeReductionPercent >= 15 && avgCsat >= 4.0) {
    return {
      decision: 'PERSEVERE',
      confidence: 'HIGH',
      rationale: '통계적으로 유의미한 리뷰 완료율 상승, 리뷰 시간 단축 및 4.0 이상의 높은 사용자 만족도를 동시 달성했습니다.'
    };
  }

  if (completionLiftPp > 0 && avgCsat >= 3.2) {
    return {
      decision: 'ITERATE',
      confidence: 'MEDIUM',
      rationale: '긍정적 지표 방향성은 확인되었으나 임계치 미달 항목 보완 후 재실험이 필요합니다.'
    };
  }

  return {
    decision: 'PIVOT',
    confidence: 'HIGH',
    rationale: '핵심 지표 개선 효과가 없거나 사용자 만족도가 기준치 미만으로 제품 가설 재설계가 필요합니다.'
  };
}

module.exports = {
  evaluatePersonaScenario,
  aggregateFeedback,
  analyzeTwoWeekExperiment,
  decidePivotOrPersevere
};
