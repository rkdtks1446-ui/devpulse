const ALLOWED_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci'];

function validateCommitMessage(message) {
  if (typeof message !== 'string') return false;
  const match = message.match(/^([a-z]+)(\([a-z0-9-]+\))?:\s.+$/);
  if (!match) return false;
  return ALLOWED_TYPES.includes(match[1]);
}

module.exports = { validateCommitMessage, ALLOWED_TYPES };
