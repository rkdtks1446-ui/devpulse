# ADR-002: `[MUST]/[SHOULD]` 우선순위 PR 리뷰 UI 정식 채택 (Persevere 결정)

- **상태**: Accepted (Persevere)
- **결정일**: 2026-11-26
- **관련 실험**: `pr_review_guidance_v1` (`enableSmartPrSummary` Feature Flag, 2주 운영)

## Context (배경)
기존 기본 리스트형 PR 리뷰 UI(Variant A)에서는 리뷰 우선순위 파악과 대형 PR 검토에 평균 219초가 소요되고 리뷰 완료율이 61%대에 머물렀습니다. 이를 해결하기 위해 Feature Flag 기반 2주 A/B 테스트와 10개 LLM 페르소나 시나리오 평가를 수행했습니다.

## Decision (결정)
실험 결과에 따라 제품 가설을 **Persevere(유지 및 전체 사용자 100% 확산)**하기로 결정합니다.
1. Variant B(`[MUST]/[SHOULD]` 우선순위 체크리스트 + 스마트 요약)를 기본 프로덕션 UI로 승격합니다.
2. 10명 페르소나 피드백에서 도출된 하위 마찰 지점(초심자 커밋 메시지 예시 추천, 모바일 컴팩트 뷰)은 GitHub Issues 실험 백로그로 등록해 차기 스프린트에서 개선합니다.

## Consequences (결과 및 기대 효과)
- 리뷰 완료율 **+17%p 이상 상승** 및 평균 리뷰 시간 **약 28% 단축** 효과의 전사 확산
- 통계적 유의성(`|Z| >= 1.96`)이 확보된 데이터 기반 의사결정 프로세스 정착
