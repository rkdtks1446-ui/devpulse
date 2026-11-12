function parseSafeJson(rawText) {
  if (rawText === null || rawText === undefined) {
    throw new Error('Input JSON text cannot be null or undefined');
  }
  const cleaned = String(rawText).replace(/^\uFEFF/, '').trim();
  if (!cleaned) {
    throw new Error('Input JSON text is empty');
  }
  return JSON.parse(cleaned);
}

module.exports = { parseSafeJson };
