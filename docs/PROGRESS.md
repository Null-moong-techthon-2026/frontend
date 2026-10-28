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
| 4 | 주최자: 사이드바에 스태프·통계 추가, 스태프(명단·근무표·실시간 현황·팝업), 통계 | ✅ (`/organizer/staff?tab=roster|schedule|live`, `/organizer/stats`, 더미 데이터 `src/dummy/staffStore.js`·`statsData.js`) |
| 5 | 스태프 모바일(초대 코드·역할 선택·승인 대기·홈·일정·공지·프로필·개인정보 수정·근무 기록) | ✅ (`/staff/...`, `/invite/staff/:token`) |
| 6 | 마무리: 백엔드 요청 문서 정리, 린트·빌드, 이 문서 갱신 | ✅ |

## 어디서부터 이어서?
**0~6단계 모두 끝났습니다** (로컬 커밋만, 푸시 안 함). 남은 일은 "다듬기"와 "백엔드가 생기면 연결"뿐입니다.

### 바로 할 수 있는 다음 작업
1. 사용자 확인 후 푸시 요청이 오면 `git push origin main` (프론트 저장소 frontend).
2. 사용자가 와이어프레임과 다른 점을 지적하면 해당 화면만 수정 (화면 위치는 아래 표).
3. 백엔드에 API가 생기면 `docs/BACKEND_REQUESTS.md` 항목 순서대로 연결 — 각 `src/api/*Api.js`/`src/dummy/*.js`의 함수 본문만 교체 (모양은 그대로).

### 화면 위치
| 앱 | 주소 | 파일 |
|---|---|---|
| 방문객 | `/e/:eventId/...` | `src/pages/visitor/`, 데이터 `src/api/visitorApi.js` |
| 부스 운영자 | `/operator/...`, `/invite/:code` | `src/pages/operator/`, `src/api/operatorApi.js` |
| 스태프 | `/staff/...`, `/invite/staff/:token` | `src/pages/staff/`, `src/api/staffApi.js`, `src/dummy/staffStore.js` |
| 주최자 스태프·통계 | `/organizer/staff`, `/organizer/stats` | `src/pages/OrganizerStaffPage.jsx`, `OrganizerStatsPage.jsx`, `src/dummy/*` |
| 공통 모바일 틀 | | `src/components/mobile/` |

### 알려진 한계 / 결정해 둔 것 (사용자에게 확인받을 것)
- 부스 사진·운영 시간·SNS·후원사·광고·결제 내역·신청서 추가 항목은 서버에 없어 자리만 있거나 샘플(`?demo=1`)로만 보임.
- 재고 단계는 서버 값(충분·부족·품절·무제한)만 씀. 와이어프레임의 "중간"은 없음.
- 스태프 가입은 서버에 STAFF가 없어서 OPERATOR로 가입시킨 뒤 이 브라우저에 STAFF로 기억함 → 다른 브라우저에서는 역할을 모름.
- 가입 유형 선택 모달의 스태프 아이콘은 주최자 아이콘과 같은 임시 그림.
- 정산 관리는 "준비중" 그대로. 알림(종 아이콘)은 공지로 이동만 함.
- 행사 개설은 서버에 만들 수 없어 임시 행사(브라우저 저장)로 대시보드를 봄 → BACKEND_REQUESTS 1번.

### 확인 방법
`npm run dev -- --port 5199 --host 127.0.0.1` 후 주소 끝에 `?demo=1`(참여한 계정) / `?demo=2`(새 계정) / `?demo=0`(끄기).
헤드리스 캡처: `chrome --headless=new --window-size=620,1000 --virtual-time-budget=8000 --screenshot=파일 URL` (주최자 화면은 1500x1000).

### 공용 조각
`components/mobile/`(MobileLayout, MobileUi, MobileFooter, MIcon, mobile.css의 mb-*), `utils/useAsync.js`, `utils/mobileFormat.js`, `utils/demo.js`.

### 주의
Bash 도구에서 큰 heredoc이 깨질 수 있으니 파일은 Write 도구로 만든다. 데모 모드는 `api/client.js`가 서버 호출을 막고 `EventProvider`가 샘플 행사를 준다.
