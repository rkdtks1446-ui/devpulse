function parseLegacyPrReport(raw) {
  if (!raw) return { items: [], highRiskCount: 0, totalLines: 0 };
  var lines = String(raw).split('\n');
  var items = [];
  var high = 0;
  var total = 0;
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (l === '' || l.indexOf('#') === 0) continue;
    var parts = l.split(',');
    if (parts.length < 3) continue;
    var id = parts[0].trim();
    var chg = parseInt(parts[1].trim(), 10);
    if (isNaN(chg) || chg < 0) chg = 0;
    var rev = parseInt(parts[2].trim(), 10);
    if (isNaN(rev) || rev < 0) rev = 0;
    var risk = 'LOW';
    if (chg > 500 && rev === 0) { risk = 'CRITICAL'; high++; }
    else if (chg > 500 || (chg > 200 && rev === 0)) { risk = 'HIGH'; high++; }
    else if (chg > 200) { risk = 'MEDIUM'; }
    total += chg;
    items.push({ id: id, changedLines: chg, reviewers: rev, risk: risk });
  }
  return { items: items, highRiskCount: high, totalLines: total };
}

module.exports = { parseLegacyPrReport };
