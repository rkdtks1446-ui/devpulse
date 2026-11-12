const fs = require('fs');

const inputPath = process.argv[2] || 'metrics/dora-metrics.json';
const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);
const m = data.metrics;

const report = `# DevPulse 주간 DORA 4대 지표 리포트

- **대상 저장소**: \`${data.repository}\`
- **수집 일시 (UTC)**: \`${data.collectedAt}\`

| DORA 4대 지표 | 측정 결과 | 양호 기준 |
| :--- | :---: | :--- |
| **Deployment Frequency (배포 빈도)** | **${m.deploymentFrequencyPerMonth}회 / 월** | 주 1회 이상 |
| **Lead Time for Changes (변경 리드 타임)** | **${m.leadTimeHours} 시간** | 24시간 이내 |
| **Change Failure Rate (변경 실패율)** | **${m.changeFailureRatePercent}%** | 15% 이하 |
| **MTTR (평균 복구 시간)** | **${m.mttrHours} 시간** | 24시간 이내 |
`;

console.log(report);
