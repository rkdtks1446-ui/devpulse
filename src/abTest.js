const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_EXPERIMENT = {
  experimentId: 'pr_review_guidance_v1',
  variants: {
    A: { name: 'control_standard_list', weight: 50, description: '기본 PR 변경 라인 리스트 UI' },
    B: { name: 'treatment_priority_tags', weight: 50, description: '[MUST]/[SHOULD] 우선순위 체크리스트 UI' }
  }
};

function assignVariant(userId, experiment = DEFAULT_EXPERIMENT) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId must be a non-empty string');
  }
  const digest = crypto
    .createHash('sha256')
    .update(`${experiment.experimentId}:${userId}`)
    .digest('hex');
  const bucket = parseInt(digest.slice(0, 8), 16) % 100;
  const variantKey = bucket < experiment.variants.A.weight ? 'A' : 'B';

  return {
    experimentId: experiment.experimentId,
    userId,
    variant: variantKey,
    variantName: experiment.variants[variantKey].name,
    bucket
  };
}

function trackEvent({ userId, eventType, experiment = DEFAULT_EXPERIMENT, metadata = {}, logFilePath = null }) {
  const assignment = assignVariant(userId, experiment);
  const record = {
    timestamp: new Date().toISOString(),
    experimentId: assignment.experimentId,
    userId: assignment.userId,
    variant: assignment.variant,
    variantName: assignment.variantName,
    eventType,
    metadata
  };

  if (logFilePath) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    fs.appendFileSync(logFilePath, JSON.stringify(record) + '\n', 'utf8');
  }
  return record;
}

function summarizeEvents(events) {
  const stats = {
    A: { exposures: 0, conversions: 0, conversionRate: 0 },
    B: { exposures: 0, conversions: 0, conversionRate: 0 }
  };

  for (const ev of events) {
    if (!stats[ev.variant]) continue;
    if (ev.eventType === 'exposure') stats[ev.variant].exposures += 1;
    if (ev.eventType === 'review_completed') stats[ev.variant].conversions += 1;
  }

  for (const key of ['A', 'B']) {
    const { exposures, conversions } = stats[key];
    stats[key].conversionRate = exposures > 0 ? Number(((conversions / exposures) * 100).toFixed(2)) : 0;
  }
  return stats;
}

module.exports = { DEFAULT_EXPERIMENT, assignVariant, trackEvent, summarizeEvents };
