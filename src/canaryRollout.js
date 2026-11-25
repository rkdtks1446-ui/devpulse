const fs = require('fs');
const path = require('path');

const DEFAULT_CANARY_CONFIG_PATH = path.join(__dirname, '..', 'config', 'canary-rollout.json');

function loadCanaryConfig(configPath = DEFAULT_CANARY_CONFIG_PATH) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function isHealthy(metrics, thresholds) {
  const healthOk = thresholds.requireHealthOk ? metrics.healthStatus === 'ok' : true;
  const errorOk = metrics.errorRate <= thresholds.maxErrorRate;
  const latencyOk = metrics.p95LatencyMs <= thresholds.maxP95LatencyMs;
  return healthOk && errorOk && latencyOk;
}

function executeCanaryRollout(healthProbe, customConfig = null) {
  const config = customConfig || loadCanaryConfig();
  const history = [];
  let currentTrafficPercent = 0;

  for (const stagePercent of config.stages) {
    const metrics = healthProbe(stagePercent);
    const healthy = isHealthy(metrics, config.healthThresholds);

    history.push({
      stagePercent,
      timestamp: new Date().toISOString(),
      metrics,
      healthy,
      action: healthy ? 'PROMOTE' : 'ROLLBACK'
    });

    if (!healthy && config.autoRollbackOnFailure) {
      return {
        service: config.service,
        status: 'ROLLED_BACK',
        failedAtStage: stagePercent,
        activeTrafficPercent: 0,
        activeVersion: config.stableVersion,
        history
      };
    }
    currentTrafficPercent = stagePercent;
  }

  return {
    service: config.service,
    status: 'COMPLETED',
    failedAtStage: null,
    activeTrafficPercent: currentTrafficPercent,
    activeVersion: config.targetVersion,
    history
  };
}

module.exports = { loadCanaryConfig, isHealthy, executeCanaryRollout };
