const fs = require('fs');
const path = require('path');
const { classifyPrSize } = require('./prSizeAnalyzer');
const { validateCommitMessage } = require('./commitValidator');

function generateBuildManifest(options = {}) {
  const distDir = options.distDir || path.join(__dirname, '..', 'dist');
  const env = options.env || process.env;
  fs.mkdirSync(distDir, { recursive: true });

  const manifest = {
    project: 'DevPulse',
    version: '1.0.1',
    builtAt: new Date().toISOString(),
    secretConfigured: Boolean(env.DEVPULSE_API_TOKEN),
    sampleCheck: {
      prSize120: classifyPrSize(120),
      validCommit: validateCommitMessage('feat(ci): add matrix build pipeline')
    }
  };

  fs.writeFileSync(
    path.join(distDir, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  return manifest;
}

if (require.main === module) {
  const manifest = generateBuildManifest();
  console.log('Build manifest generated:', manifest);
}

module.exports = { generateBuildManifest };
