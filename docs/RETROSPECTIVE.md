# DevPulse 프로젝트 종합 회고록 (1~8단계)

- **저장소**: `rkdtks1446-ui/devpulse`
- **작성일**: 2026-11-12
- **작성자**: 이강산 (`@rkdtks1446-ui`)

## 1. 단계별 핵심 산출물 요약
| 단계 | 핵심 주제 | 주요 구현 및 산출물 |
| :--- | :--- | :--- |
| **1~2단계** | 저장소 초기화 및 DORA 대시보드 | DORA 4대 지표 수집·주간 리포트·Chart.js 대시보드 시각화 및 `README.md` 반영 |
| **3단계** | 애자일 백로그 및 칸반 운영 | Issue Template 2종, 라벨 체계, 마일스톤 2개, 백로그 10건, `DevPulse Sprint Board`, `docs/SPRINT_ANALYTICS.md` |
| **4단계** | 브랜치 전략 및 구조화 코드 리뷰 | `CONTRIBUTING.md`, `CODEOWNERS`, PR 템플릿, `[MUST]`/`[SHOULD]` 리뷰 3건, `main` 브랜치 보호 규칙 |
| **5단계** | 팀 지식베이스 및 거버넌스 자동화 | Wiki 3종 상호 링크, `docs/adr/` 기술 결정 기록, `community-sla.yml` 자동화, Discussions RFC 토론 |
| **6단계** | 오픈소스 표준 및 Inner Source | `LICENSE`(MIT), `CODE_OF_CONDUCT.md`, `SECURITY.md`, `docs/OSS_AND_INNERSOURCE.md` |
| **7단계** | Node.js CI/CD 파이프라인 구축 | ESLint·Jest 단위 테스트, Composite Action, Reusable Workflow, OS/Node Matrix, Secrets·Artifact 선택적 배포 |
| **8단계** | 회고 및 정식 릴리스 발행 | `docs/RETROSPECTIVE.md`, `README.md` 상태 배지 연동, Semantic Versioning `v1.0.0` 릴리스 |

## 2. KPT (Keep / Problem / Try) 회고
### Keep (유지할 강점)
- **작은 단위의 PR과 구조화된 리뷰**: 기능별로 브랜치를 분리하고 `[MUST]` / `[SHOULD]` 태그를 사용해 수정 우선순위를 명확히 한 덕분에 예외 처리(`NaN`, 음수, UTF-8 BOM)를 놓치지 않고 보완할 수 있었습니다.
- **CI/CD 모듈화 및 실행 최적화**: Composite Action과 Reusable Workflow로 중복 스텝을 제거하고, `dorny/paths-filter`를 통해 코드 변경 시에만 배포 잡이 실행되도록 설계해 빌드 시간을 단축했습니다.

### Problem (겪었던 문제와 해결)
- **브랜치 보호 규칙과 1인 리뷰 정책 충돌**: `main` 브랜치 보호 규칙 활성화 후 본인 PR에 직접 Approve할 수 없어 병합이 차단되는 현상이 발생했으나, 규칙 구조를 이해하고 관리자 병합 및 세부 옵션 조정을 통해 해결했습니다.
- **환경별 인코딩 차이**: Windows 환경의 UTF-8 BOM 문자로 인한 JSON 파싱 실패를 사전에 `src/jsonSanitizer.js`와 Jest 테스트 케이스로 방어했습니다.

### Try (향후 고도화 계획)
- **실시간 웹 대시보드 배포 자동화**: 현재 `dist/build-manifest.json` 아티팩트 생성 단계에서 나아가 GitHub Pages 또는 컨테이너 환경으로 DORA 대시보드를 자동 배포하는 CD 파이프라인을 확장할 예정입니다.
- **커스텀 설정 파일 지원**: RFC 토론에서 도출된 대로 PR 크기 임계값(200줄/500줄)을 `.devpulserc.json` 설정 파일로 유연하게 조정할 수 있도록 개선합니다.
