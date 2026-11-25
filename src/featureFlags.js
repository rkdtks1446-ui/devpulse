const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'feature-flags.json');

function loadFlagConfig(configPath = DEFAULT_CONFIG_PATH) {
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function getBucket(key) {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100;
}

function parseEnvBoolean(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
  return null;
}

function evaluateFlag(flagKey, options = {}) {
  const config = options.config || loadFlagConfig();
  const env = options.env || process.env;
  const userId = options.userId || 'anonymous';
  const flag = config[flagKey];

  if (!flag) {
    return { flagKey, enabled: false, reason: 'unknown_flag', userId };
  }

  const envOverride = flag.envVar ? parseEnvBoolean(env[flag.envVar]) : null;
  if (envOverride !== null) {
    return { flagKey, enabled: envOverride, reason: `env:${flag.envVar}`, userId };
  }

  if (Array.isArray(flag.targetUsers) && flag.targetUsers.includes(userId)) {
    return { flagKey, enabled: true, reason: 'target_user', userId };
  }

  if (typeof flag.rolloutPercentage === 'number' && flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100) {
    const bucket = getBucket(`${flagKey}:${userId}`);
    return {
      flagKey,
      enabled: bucket < flag.rolloutPercentage,
      reason: `rollout:${flag.rolloutPercentage}%`,
      bucket,
      userId
    };
  }

  return { flagKey, enabled: Boolean(flag.enabled), reason: 'default', userId };
}

function evaluateAllFlags(options = {}) {
  const config = options.config || loadFlagConfig();
  const result = {};
  for (const key of Object.keys(config)) {
    result[key] = evaluateFlag(key, { ...options, config });
  }
  return result;
}

module.exports = { loadFlagConfig, evaluateFlag, evaluateAllFlags, getBucket };
