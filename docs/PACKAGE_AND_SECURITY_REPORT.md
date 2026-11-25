# 패키지 배포(1.0.0 → 1.0.1), Docker 및 보안 자동화 검증 리포트

## 1. GitHub Packages (`@rkdtks1446-ui/devpulse`) 배포 이력
- **레지스트리**: `https://npm.pkg.github.com`
- **초기 배포 버전**: `1.0.0`
- **업데이트 버전**: `1.0.1` (`npm version patch` 적용 후 자동 배포 파이프라인 검증 완료)

## 2. Docker 컨테이너 빌드 및 로컬 실행 검증
- **이미지 레지스트리**: `ghcr.io/rkdtks1446-ui/devpulse:latest`
- **로컬 실행 검증 결과**: `docker build -t devpulse:1.0.1 .` 및 `docker run --rm devpulse:1.0.1` 정상 실행 확인

## 3. Dependabot 및 보안 스캔 자동화 정책
- **Dependabot (`.github/dependabot.yml`)**: 매주 월요일 09:00(Asia/Seoul) `npm` 및 `github-actions` 의존성 점검, 그룹화 및 `patch`/`minor` 자동 병합(`dependabot-auto-merge.yml`)
- **보안 스캔 (`.github/workflows/security-audit.yml`)**: `npm audit` 취약점 스캔 결과 GitHub Issue 자동 생성
