function parseSafeJson(rawText) {
  const cleaned = String(rawText).replace(/^\uFEFF/, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { parseSafeJson };
