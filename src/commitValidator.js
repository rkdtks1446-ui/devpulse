const ALLOWED_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci'];
const COMMIT_REGEX = /^([a-z]+)(\([a-z0-9-]+\))?:\s.+$/;

function validateCommitMessage(message) {
  if (typeof message !== 'string') return false;
  const match = message.trim().match(COMMIT_REGEX);
  if (!match) return false;
  return ALLOWED_TYPES.includes(match[1]);
}

module.exports = { validateCommitMessage, ALLOWED_TYPES, COMMIT_REGEX };
