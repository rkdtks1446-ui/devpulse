# 학기 프로젝트 제안서: DevPulse

- **작성자**: 동아대학교 컴퓨터공학과 2452652 이강산
- **저장소**: https://github.com/rkdtks1446-ui/devpulse

## 1. 프로젝트명
**DevPulse (데브펄스)**: GitHub 활동 데이터 기반 팀 프로젝트 진척도 시각화 및 코드 리뷰 보조 플랫폼

## 2. 문제 정의
- 대학 소프트웨어 개발 팀 프로젝트에서는 작업 분배 편중, 마감 직전 대규모 PR 병합 충돌, 피상적인 코드 리뷰 문제가 반복됩니다.
- GitHub 기본 통계만으로는 PR 크기 적정성, 커밋 컨벤션 준수 여부, DORA 4대 지표를 한눈에 파악하기 어렵습니다.
- 이를 해결하기 위해 PR 품질을 자동 검증하고 DORA 4대 지표를 시각화·리포트화하는 협업 보조 도구를 구축합니다.

## 3. 핵심 기능 3개
1. **PR 크기 및 Conventional Commits 자동 검증**: 변경 라인 수에 따라 PR을 Small(200줄 이하)/Medium/Large(500줄 이상)로 분류하고 커밋 메시지 규칙을 검사합니다.
2. **DORA 4대 지표 자동 수집 및 대시보드**: 배포 빈도, 변경 리드 타임, 변경 실패율, MTTR을 자동 집계하여 Chart.js 대시보드로 시각화합니다.
3. **주간 스프린트 리포트 자동 생성**: 매주 수집된 JSON 아티팩트를 기반으로 마크다운 주간 보고서를 자동 생성·커밋합니다.

## 4. 기술 스택
- **Runtime & Backend**: Node.js 20, JavaScript
- **Frontend & Visualization**: HTML5, CSS3, Chart.js
- **Test & Lint**: Jest, ESLint
- **CI/CD & Collaboration**: GitHub Actions, GitHub Projects, Wiki, Discussions

## 5. 16주 마일스톤 초안
| 주차 | 단계 | 주요 수행 내용 | 핵심 산출물 |
| :--- | :--- | :--- | :--- |
| **1–2주** | 기획 및 환경 구축 | 저장소 개설, 프로젝트 제안서 및 10개 백로그 이슈 수립 | `docs/PROPOSAL.md`, GitHub Project 보드 |
| **3–4주** | 표준화 및 설계 | ADR 작성, PR/이슈 템플릿, 코드 리뷰 가이드 및 브랜치 보호 설정 | `docs/adr/`, `CONTRIBUTING.md` |
| **5–6주** | 핵심 기능 1 개발 | PR 라인 수 분류 및 Conventional Commits 검증 모듈 구현 | `src/prAnalyzer.js`, 단위 테스트 |
| **7–8주** | 핵심 기능 2 개발 | GitHub API 연동 DORA 4대 지표 수집 스크립트 작성 | `scripts/collect-dora.js` |
| **9–10주** | 핵심 기능 3 개발 | Chart.js 대시보드 및 주간 마크다운 리포트 자동 생성기 구현 | `dashboard/index.html`, 주간 리포트 |
| **11–12주** | CI/CD 파이프라인 | Matrix 빌드/테스트, Secrets 주입, 아티팩트 전달 워크플로우 구축 | `.github/workflows/ci-cd.yml` |
| **13–14주** | 파이프라인 최적화 | Composite Action, Reusable Workflow, 캐싱 및 선택적 배포 구현 | `docs/CI_OPTIMIZATION_REPORT.md` |
| **15–16주** | 문서화 및 최종 발표 | OSS 라이선스·Wiki·Discussions 정비 및 최종 시연 | 최종 보고서, 릴리스 |
