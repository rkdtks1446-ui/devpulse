# DevPulse
[![DevPulse CI/CD Pipeline](https://github.com/rkdtks1446-ui/devpulse/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/rkdtks1446-ui/devpulse/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

GitHub 활동 데이터 기반 팀 프로젝트 진척도 시각화 및 코드 리뷰 보조 플랫폼

## DORA Metrics Dashboard
![DORA 4대 지표 대시보드](docs/images/dora-dashboard.png)

## Core Features
- **PR Size Analyzer (`src/prSizeAnalyzer.js`)**: 변경 라인 수 기반 PR 크기(`Small` / `Medium` / `Large`) 자동 분류
- **Commit Validator (`src/commitValidator.js`)**: Conventional Commits 규칙 준수 여부 정규식 검증
- **Safe JSON Sanitizer (`src/jsonSanitizer.js`)**: Windows UTF-8 BOM 제거 및 예외 처리 파싱
- **Automated CI/CD (`.github/workflows/ci-cd.yml`)**: Ubuntu/Windows × Node 18/20 Matrix 테스트, Composite Action, Artifact 업로드 및 변경 감지 선택적 배포

## Documentation & Governance
- **Contributing & Branch Strategy**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code Review Guidelines**: [docs/REVIEW_GUIDE.md](docs/REVIEW_GUIDE.md)
- **Architecture Decision Records**: [docs/adr/001-zero-dependency-dora-collector.md](docs/adr/001-zero-dependency-dora-collector.md)
- **Sprint Metrics Analysis**: [docs/SPRINT_ANALYTICS.md](docs/SPRINT_ANALYTICS.md)
- **OSS License & Inner Source Roadmap**: [docs/OSS_AND_INNERSOURCE.md](docs/OSS_AND_INNERSOURCE.md)
- **Project Retrospective**: [docs/RETROSPECTIVE.md](docs/RETROSPECTIVE.md)
- **Code of Conduct & Security**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | [SECURITY.md](SECURITY.md)
