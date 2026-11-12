function classifyPrSize(changedLines) {
  const lines = Number(changedLines);
  if (lines <= 200) return 'Small';
  if (lines <= 500) return 'Medium';
  return 'Large';
}

module.exports = { classifyPrSize };
