const fs = require('fs');
const path = require('path');
const { classifyPrSize } = require('./prSizeAnalyzer');
const { validateCommitMessage } = require('./commitValidator');

const distDir = path.join(__dirname, '..', 'dist');
fs.mkdirSync(distDir, { recursive: true });

const hasSecret = Boolean(process.env.DEVPULSE_API_TOKEN);
const manifest = {
  project: 'DevPulse',
  version: '1.0.0',
  builtAt: new Date().toISOString(),
  secretConfigured: hasSecret,
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

console.log('Build manifest generated:', manifest);
