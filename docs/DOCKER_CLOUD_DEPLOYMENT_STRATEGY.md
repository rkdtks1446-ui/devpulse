# Docker 기반 배포 파이프라인 및 클라우드 운영 전략

## 1. 프런트엔드 자동 배포 및 PR 프리뷰 아키텍처
- **프로덕션 배포 (`.github/workflows/deploy-pages.yml`)**: `main` 브랜치에 `public/**` 변경이 병합되면 GitHub Pages(`https://rkdtks1446-ui.github.io/devpulse/`)로 자동 배포합니다.
- **PR 프리뷰 환경 (`.github/workflows/pr-preview.yml`)**: PR 생성·업데이트 시 `gh-pages` 브랜치의 `/pr-preview/pr-<번호>/` 경로에 격리 배포하고, PR 댓글에 프리뷰 URL을 자동 게시해 리뷰어가 병합 전 UI 변경을 직접 검증할 수 있도록 구성했습니다.

## 2. Docker 기반 배포 파이프라인 전략
1. **멀티스테이지 빌드 (`Dockerfile`)**: 의존성 설치 단계(`deps`)와 실행 런타임(`runner`)을 분리하고 `node:20-alpine` 이미지를 사용해 이미지 크기와 공격 표면을 최소화합니다.
2. **불변 이미지 태깅 (Immutable Tagging)**: `ghcr.io/rkdtks1446-ui/devpulse:sha-<커밋해시>` 및 `latest` 태그를 동시 발행하여 장애 시 직전 SHA 태그로 즉시 롤백(Rollback)할 수 있습니다.
3. **무중단 배포 전략 (Rolling / Revision Traffic Splitting)**:
   - **신규 리비전 배포**: 새 컨테이너 기동 후 `/ready` 및 `/health` 프로브 3회 연속 성공 확인
   - **트래픽 전환**: 검증 통과 시 기존 리비전에서 신규 리비전으로 트래픽 100% 전환 (실패 시 기존 리비전 유지 및 자동 롤백)

## 3. 클라우드 서버리스 컨테이너(GCP Cloud Run / Render) 배포 및 모니터링
- **자동 배포 (`.github/workflows/deploy-cloud-run.yml`)**:
  - 컨테이너 빌드 → CI 내부 헬스체크 스모크 테스트(`/health`, `/ready`, `/metrics`) 통과 → GCP Cloud Run(`google-github-actions/deploy-cloudrun@v2`) 자동 배포 (`GCP_SA_KEY`, `GCP_PROJECT_ID` 등록 시 라이브 배포, 미등록 시 컨테이너 헬스체크 검증 모드로 안전 통과)
  - Render 외부 클라우드 연동을 위한 IaC 선언 파일(`render.yaml`, `healthCheckPath: /health`) 병행 제공
- **헬스체크 및 모니터링 (`.github/workflows/health-monitor.yml`)**:
  - 30분 주기(`cron: '*/30 * * * *'`) 및 수동 실행으로 라이브 엔드포인트 HTTP 상태 코드와 응답 지연 시간(ms)을 측정
  - 연속 실패 시 GitHub Issues에 `[Alert] Service Healthcheck Failed` 장애 알림 이슈를 자동 생성
