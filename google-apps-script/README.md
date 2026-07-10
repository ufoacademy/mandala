# 리드 저장용 Google Apps Script 배포 방법

1. 리드를 저장할 새 Google Sheets 문서를 만듭니다. 첫 행에 헤더를 넣어둡니다: `날짜 | 이름 | 연락처 | 총점`
2. 메뉴에서 **확장 프로그램 → Apps Script**를 클릭합니다.
3. 기본 코드를 지우고 `lead-webhook.gs` 내용을 붙여넣습니다.
4. 우측 상단 **배포 → 새 배포**를 클릭합니다.
5. 유형 선택에서 **웹 앱**을 선택합니다.
6. 설정:
   - 실행 계정: 나(본인 계정)
   - 액세스 권한이 있는 사용자: 모든 사용자
7. **배포**를 클릭하고 권한 승인을 완료합니다.
8. 발급된 **웹 앱 URL**을 복사합니다 (`https://script.google.com/macros/s/XXXX/exec` 형태).
9. 이 URL을 Vercel 프로젝트의 `SHEETS_WEBHOOK_URL` 환경변수로 등록합니다 (Task 10 참고).

## 동작 확인 (curl)

```bash
curl -X POST "여기에_배포된_웹앱_URL" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2026-07-10T00:00:00.000Z","name":"테스트","contact":"010-0000-0000","totalScore":160}'
```

시트에 새 행이 추가되면 성공입니다.
