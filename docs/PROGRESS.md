# 부스럭 프론트 진행 현황 (이어서 작업용)

> 새 세션이면 이 파일부터 읽는다. 맨 아래 **"어디서부터 이어서?"** 가 시작점.
> 백엔드에 요청할 것은 [BACKEND_REQUESTS.md](./BACKEND_REQUESTS.md).

## 목표
Figma 와이어프레임(주최자 웹 + 부스 운영자/스태프/방문객 모바일)을 프론트로 똑같이 만들고,
배포된 백엔드에 연동 가능한 부분은 모두 연동한다. 이미 구현된 주최자 화면(대시보드·지도 제작·부스 관리·부스 모집·실시간 운영 현황·공지사항)은 건드리지 않는다.

## 확정된 결정 (사용자 지시)
- 백엔드: 팀원이 배포한 서버(`vite.config.js`의 BACKEND). 로컬 backend-main은 삭제됨.
- 모바일 화면(운영자·스태프·방문객)은 모바일 규격으로 만든다. 데스크톱에서는 가운데 정렬된 폭 약 430px 카드.
- 회원가입 유형이 3개로 늘어남: 주최자 / 부스 운영자 / **스태프**.
- 행사 개설 신청: 제출하면 즉시 승인되는 더미(브라우저 저장) → 대시보드로 이동. 실제 신청·승인은 나중에 사용자가 추가. (`src/api/eventApplicationApi.js`)
- 샘플 데이터: **`?demo=1` 미리보기 모드**. 평소에는 실제 서버 데이터만. 서버에 API가 아예 없는 것(스태프·통계·후원사·출퇴근)은 더미 데이터로 만든다.
- 와이어프레임의 부스 마크 그림 등은 주최자가 올린 이미지(없으면 기본 그림)로 대체한다.
- 애매하면 사용자에게 질문한다.

## 구조 규칙
- 모바일 공통 틀: `src/components/mobile/` (MobileShell, 상단바, 하단 탭).
- 역할: `src/utils/role.js` (ORGANIZER / OPERATOR / STAFF). 서버가 역할을 저장하지 않아 가입 시 브라우저에 기억 → 백엔드 요청 항목.
- 데이터 접근: `src/api/*Api.js`. 서버 API가 있으면 실제 호출, 없으면 더미(`src/dummy/`)로 같은 모양을 돌려준다. 교체는 함수 본문만.
- 라우트: 방문객 `/e/:eventId/...`, 운영자 `/operator/...`, 스태프 `/staff/...`, 주최자 `/organizer/...`, 초대 `/invite/:code`(운영자), `/invite/staff/:code`(스태프).

## 단계별 진행 (✅ 완료 / 🔄 진행 중 / ⬜ 아직)
| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 이 문서, 백엔드 요청 문서, 메모리 | ✅ |
| 1 | 기반: 데모 모드, 역할(스태프 추가), 회원가입 3유형, 로그인 후 역할별 이동, 모바일 틀 | ✅ (라우트는 만든 단계에서 추가) |
| 2 | 방문객 화면(홈·부스·부스 상세·지도·행사 정보·공지·공지 상세·후원사) | ✅ (`/e/:eventId`, `?demo=1`로 확인) |
| 3 | 부스 운영자 화면(홈·부스 모집·공고 상세·신청서·내 부스·메뉴 재고·부스 정보 수정·공지·프로필·초대 코드) | ✅ (`/operator/...`, `/invite/:code`, `?demo=1` 참여 후 / `?demo=2` 새 계정) |
| 4 | 주최자: 사이드바에 스태프·통계 추가, 스태프(명단·근무표·실시간 현황·팝업), 통계 | ⬜ |
| 5 | 스태프 모바일(초대 코드·역할 선택·승인 대기·홈·일정·공지·프로필·개인정보 수정·근무 기록) | ⬜ |
| 6 | 마무리: 백엔드 요청 문서 정리, 린트·빌드, 이 문서 갱신 | ⬜ |

## 어디서부터 이어서?
- 완료: 0~3단계. 운영자 화면은 `src/pages/operator/`, 데이터는 `src/api/operatorApi.js`.
- 다음: **4단계 주최자 스태프·통계** — `components/OrganizerLayout.jsx`의 NAV에 스태프·통계 항목 추가(지금 NAV: 대시보드·지도 제작·부스 관리·부스 모집·실시간 운영 현황·공지사항·정산 관리; 와이어프레임 순서는 ...실시간 운영 현황·**스태프**·공지사항·정산 관리·**통계**), `src/pages/OrganizerStaffPage.jsx`(명단/근무표/실시간 현황 3탭 + 팝업 3개), `OrganizerStatsPage.jsx`. 백엔드가 없으니 더미(`src/dummy/staffData.js`)로.
- 그 다음 5단계 스태프 모바일(`/staff/...`), 6단계 마무리.
- 화면 확인법: `npm run dev -- --port 5199 --host 127.0.0.1` 후 주소 끝에 `?demo=1`(참여한 계정) / `?demo=2`(새 계정). 방문객 `/e/demo-event?demo=1`, 운영자 `/operator/home?demo=1`.
  헤드리스 캡처: `chrome --headless=new --window-size=620,1000 --virtual-time-budget=8000 --screenshot=파일 URL`.
- 공용 조각: `components/mobile/`(MobileLayout, MobileUi, MobileFooter, MIcon, mobile.css의 mb-*), `utils/useAsync.js`, `utils/mobileFormat.js`, `utils/demo.js`.
- 주의: Bash 도구에서 큰 heredoc이 깨질 수 있으니 파일은 Write 도구로 만든다. 데모 모드는 `api/client.js`가 서버 호출을 막고 `EventProvider`가 샘플 행사를 준다.
- 커밋은 로컬에만(푸시는 사용자가 요청할 때).
