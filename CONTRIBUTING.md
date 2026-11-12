# DevPulse 기여 및 협업 가이드 (Contributing Guide)

## 1. 브랜치 전략 (GitHub Flow)
- `main` 브랜치는 항상 배포 가능한 안정 상태를 유지합니다.
- 모든 기능 개발과 버그 수정은 `main`에서 분기한 작업 브랜치에서 수행합니다.
  - 기능 개발: `feat/<이슈번호>-<간단한-설명>` (예: `feat/1-pr-size-analyzer`)
  - 버그 수정: `fix/<이슈번호>-<간단한-설명>` (예: `fix/5-json-bom-sanitizer`)
  - 문서 작업: `docs/<이슈번호>-<간단한-설명>`

## 2. Conventional Commits 규칙
커밋 메시지는 `<type>(<scope>): <subject>` 형식을 따릅니다.
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `test`: 테스트 코드 추가 및 수정
- `refactor`: 동작 변경 없는 코드 구조 개선
- `ci`: GitHub Actions 워크플로우 및 빌드 설정 변경
- `chore`: 기타 설정 및 패키지 관리

## 3. 코드 리뷰 원칙
모든 Pull Request는 병합 전 최소 1회 이상의 구조화된 코드 리뷰를 거칩니다. 자세한 태그 규칙은 `docs/REVIEW_GUIDE.md`를 참고하세요.
