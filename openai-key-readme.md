# OpenAI API 키 보안 문제 해결 방법

GitHub는 코드에서 OpenAI API 키를 감지하고 푸시를 차단했습니다. 이 문제를 해결하기 위한 두 가지 방법이 있습니다:

## 방법 1: GitHub 보안 경고에서 "허용" 처리하기

GitHub 푸시 차단 메시지에 있는 링크를 클릭하여 해당 경고 페이지로 이동하세요. 여기서 다음 단계를 따르세요:

1. 경고 내용을 검토합니다
2. "Approve this as a false positive" 또는 "I'll fix this later" 옵션을 선택합니다
3. 해당 비밀번호가 이미 무효화되었거나 테스트용 키라면 "허용" 버튼을 클릭합니다

## 방법 2: 커밋 기록 다시 작성하기 (권장)

키가 실제로 노출되었다면, 다음 단계를 따르는 것이 좋습니다:

1. API 키 무효화하기: OpenAI 대시보드에서 해당 키를 취소하고 새 키를 발급받으세요
2. 깃 히스토리 다시 작성:

```bash
# 로컬 저장소에서 키가 포함된 커밋과 그 이후의 모든 커밋을 다시 작성
git rebase -i 4898ce8  # origin/main 이전 커밋부터 재작성

# 재작성 과정에서 .env.development 파일을 수정하여 키 제거
# 강제 푸시 (주의: 공유 저장소에는 매우 주의해서 사용)
git push --force-with-lease
```

## 향후 방지 방법

1. `.env.development` 파일이 `.gitignore`에 올바르게 등록되어 있는지 확인
2. 사전 커밋 훅을 설정하여 민감한 정보가 커밋되는 것을 방지
3. Git 필터링을 사용하여 민감한 콘텐츠 감지 (이미 설정됨)

## 참고 자료
- [GitHub 문서: 보안 비밀번호 처리](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [OpenAI API 키 관리 가이드](https://platform.openai.com/docs/guides/authentication) 