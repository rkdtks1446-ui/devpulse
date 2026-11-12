function classifyPrSize(changedLines) {
  const numeric = Number(changedLines);
  const lines = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  if (lines <= 200) return 'Small';
  if (lines <= 500) return 'Medium';
  return 'Large';
}

module.exports = { classifyPrSize };
