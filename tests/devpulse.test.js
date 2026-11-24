const { classifyPrSize } = require('../src/prSizeAnalyzer');
const { validateCommitMessage } = require('../src/commitValidator');
const { parseSafeJson } = require('../src/jsonSanitizer');
const fs = require('fs');
const path = require('path');

describe('DevPulse Core Modules', () => {
  test('classifyPrSize classifies line counts and handles invalid inputs', () => {
    expect(classifyPrSize(150)).toBe('Small');
    expect(classifyPrSize(350)).toBe('Medium');
    expect(classifyPrSize(800)).toBe('Large');
    expect(classifyPrSize(-10)).toBe('Small');
    expect(classifyPrSize('invalid')).toBe('Small');
  });

  test('validateCommitMessage checks Conventional Commits rules', () => {
    expect(validateCommitMessage('feat(ui): add DORA chart')).toBe(true);
    expect(validateCommitMessage('fix: resolve BOM parsing bug')).toBe(true);
    expect(validateCommitMessage('update something')).toBe(false);
    expect(validateCommitMessage('unknown(core): invalid type')).toBe(false);
  });

  test('parseSafeJson strips UTF-8 BOM and throws on empty input', () => {
    const bomJson = '\uFEFF{"status":"ok","count":4}';
    expect(parseSafeJson(bomJson)).toEqual({ status: 'ok', count: 4 });
    expect(() => parseSafeJson('   ')).toThrow('Input JSON text is empty');
  });

  test('DORA workflow updates reports through a pull request', () => {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'dora-metrics.yml');
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    expect(workflow).not.toMatch(/git push\s*(?:\r?\n|$)/);
    expect(workflow).toMatch(/git switch -c ["']?\$branch/);
    expect(workflow).toMatch(/git push origin ["']?HEAD:\$branch/);
    expect(workflow).toMatch(/gh pr create/);
  });
});
