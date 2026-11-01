# 부스럭 프론트 진행 현황 (이어서 작업용)

> 새 세션이면 이 파일부터 읽는다. 맨 아래 **"어디서부터 이어서?"** 가 시작점.
> 백엔드에 요청할 것은 [BACKEND_REQUESTS.md](./BACKEND_REQUESTS.md).

## 목표
Figma 와이어프레임(주최자 웹 + 부스 운영자/스태프/방문객 모바일)을 프론트로 똑같이 만들고,
배포된 백엔드에 연동 가능한 부분은 모두 연동한다. 이미 구현된 주최자 화면(대시보드·지도 제작·부스 관리·부스 모집·실시간 운영 현황·공지사항)은 건드리지 않는다.

## 확정된 결정 (사용자 지시)
- 백엔드: 팀원이 배포한 서버(`vite.config.js`의 BACKEND). 로컬 backend-main은 삭제됨.
- 모바일 화면(운영자·스태프·방문객)은 모바일 규격. 데스크톱에서는 가운데 정렬된 폭 약 430px 카드.
- 가입 유형 3개: 주최자 / 부스 운영자 / 스태프. 일반 사용자(방문객)는 계정이 필요 없음.
- 샘플 데이터는 `?demo=1`(참여한 계정) / `?demo=2`(새 계정) 미리보기 모드에서만. 평소에는 서버 데이터만.
- 2026-11-01: 행사 개설 승인(`/pending`, `/admin/applications`)과 신청 서류 업로드 API가 서버에 반영돼 프론트를 연결했다. 2026-10-31: 서버에 행사 개설·역할·스태프·부스 사진 API가 반영됨 → 프론트를 연결하고 임시 코드(행사 신청 더미, 승인 대기·관리자 화면, 가입 역할 로컬 기억, 스태프 로컬 저장)를 없앴다.
- 와이어프레임의 부스 마크 그림 등은 주최자가 올린 이미지(없으면 기본 그림)로 대체.
- 애매하면 사용자에게 질문한다.

## 구조 규칙
- 모바일 공통 틀: `src/components/mobile/` (MobileShell, 상단바, 하단 탭).
- 역할: `/api/me`의 `role`(ORGANIZER / OPERATOR / STAFF) → `src/utils/role.js`의 `homePathFor`.
- 데이터 접근: `src/api/*Api.js` (실제 호출 + `?demo` 분기). 미리보기 샘플은 `src/dummy/`.
- 라우트: 방문객 `/e/:eventId/...`, 운영자 `/operator/...`, 스태프 `/staff/...`, 주최자 `/organizer/...`, 초대 `/invite/:code`(운영자), `/invite/staff/:code`(스태프).

## 단계별 진행 (✅ 완료 / 🔄 진행 중 / ⬜ 아직)
| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 이 문서, 백엔드 요청 문서, 메모리 | ✅ |
| 1 | 기반: 데모 모드, 역할(스태프 추가), 회원가입 3유형, 로그인 후 역할별 이동, 모바일 틀 | ✅ (라우트는 만든 단계에서 추가) |
| 2 | 방문객 화면(홈·부스·부스 상세·지도·행사 정보·공지·공지 상세·후원사) | ✅ (`/e/:eventId`, `?demo=1`로 확인) |
| 3 | 부스 운영자 화면(홈·부스 모집·공고 상세·신청서·내 부스·메뉴 재고·부스 정보 수정·공지·프로필·초대 코드) | ✅ (`/operator/...`, `/invite/:code`, `?demo=1` 참여 후 / `?demo=2` 새 계정) |
| 4 | 주최자: 사이드바에 스태프·통계 추가, 스태프(명단·근무표·실시간 현황·팝업), 통계 | ✅ (`/organizer/staff?tab=roster|schedule|live`, `/organizer/stats`, `?demo` 샘플 `src/dummy/staffStore.js`, 통계는 서버가 없어 숫자 없는 "준비 중" 빈 화면) |
| 5 | 스태프 모바일(초대 코드·역할 선택·승인 대기·홈·일정·공지·프로필·개인정보 수정·근무 기록) | ✅ (`/staff/...`, `/invite/staff/:token`) |
| 6 | 마무리: 백엔드 요청 문서 정리, 린트·빌드, 이 문서 갱신 | ✅ |

## 어디서부터 이어서?
**0~6단계와 서버 연결까지 끝났습니다.** 남은 일은 서버에 없는 기능(운영 시간·후원사·통계 등)과 다듬기입니다.

### 바로 할 수 있는 다음 작업
1. 사용자 확인 후 푸시 요청이 오면 `git push origin main` (프론트 저장소 frontend).
2. 사용자가 와이어프레임과 다른 점을 지적하면 해당 화면만 수정 (화면 위치는 아래 표).
3. 서버에 없던 기능이 생기면 `docs/BACKEND_REQUESTS.md` ③ 항목을 연결한다.

### 화면 위치
| 앱 | 주소 | 파일 |
|---|---|---|
| 방문객 | `/e/:eventId/...` | `src/pages/visitor/`, 데이터 `src/api/visitorApi.js` |
| 부스 운영자 | `/operator/...`, `/invite/:code` | `src/pages/operator/`, `src/api/operatorApi.js` |
| 스태프 | `/staff/...`, `/invite/staff/:token` | `src/pages/staff/`, `src/api/staffApi.js` (샘플 `src/dummy/staffStore.js`) |
| 주최자 스태프·통계 | `/organizer/staff`, `/organizer/stats` | `src/pages/OrganizerStaffPage.jsx`, `OrganizerStatsPage.jsx`, `src/dummy/*` |
| 공통 모바일 틀 | | `src/components/mobile/` |

### 사용자 입장 점검에서 추가한 것 (와이어프레임엔 없지만 기능상 필수)
- 초대 링크로 들어온 사람이 가입·로그인을 거쳐도 원래 초대 화면으로 돌아오게 (`utils/afterLogin.js`), 로그인 화면에 초대 안내 문구.
- 주최자 대시보드: 진짜 QR 코드 생성(`qrcode`) + QR 복사(안 되면 이미지 저장) + 행사가 공개 전이면 방문객 링크가 안 열린다는 안내.
- 로그인 화면의 "아이디 찾기/비밀번호 찾기"는 눌렀을 때 "준비 중" 안내.
- 행사 개설 신청 화면(`/apply`): 단체 이름·유형, 행사 이름·기간·장소만 받는다 (서버가 저장하는 값만). 제출하면 `/pending`(승인 대기·반려 사유·승인됨)에서 기다리고, 관리자가 승인하면 행사가 열린다.
- 관리자 화면(`/admin/applications`): 로그인한 계정의 `role`이 `ADMIN`일 때만(다른 계정은 `/`로 돌려보냄). 일반 계정을 가입시킨 뒤 백엔드가 ADMIN으로 바꾼다. 로그인하면 이 화면으로 온다. 서버 승인 API로 직접 확인하기 전(ADMIN 계정 없음)이라 응답 필드는 `/api/me/event-openings`와 같다고 가정했다.
- 부스 신청서 서류 업로드(`OperatorApply`): 행사가 요청한 서류(카테고리에 맞는 것)를 파일로 올린다. 서류 있는 신청으로 서버 확인 전.

### 서버 연결 (2026-10-31)
- 행사 개설 `openEvent`, 역할 `role`, 스태프 전체 `src/api/staffApi.js`, 부스 사진 `operatorApi.js`.
- 시험 계정 3개(`cc_probe_org1`, `cc_probe_stf1`, `cc_probe_op1`)와 시험 행사 1개로 서버 전체 흐름을 확인했고(`docs/BACKEND_REQUESTS.md` ②), 그 데이터로 화면도 열어 봤다. 시험 데이터는 수요일 회의에서 DB를 비워 달라고 요청하기로 함(사용자 허락).
- 다음에 서버 데이터로 화면을 확인하려면 이 계정으로 로그인하면 된다(DB를 비우면 사라짐).

### 알려진 한계 / 결정해 둔 것 (사용자에게 확인받을 것)
- 서버에 없어서 화면이 비거나 샘플뿐인 것: 부스 운영 시간·SNS, 후원사·광고, 통계, 결제 내역, 계정 정보 수정, 행사 문의처·운영 시간·오시는 길 (`docs/BACKEND_REQUESTS.md` ③).
- 재고 단계는 서버 값(충분·부족·품절·무제한)만 씀. 와이어프레임의 "중간"은 없음.
- 가입 유형 선택 모달의 스태프 아이콘은 주최자 아이콘과 같은 임시 그림.
- 정산 관리는 "준비중" 그대로. 알림(종 아이콘)은 공지로 이동만 함.
- 스태프 실시간 현황은 명단에서 계산하고 30초마다 다시 불러옴(`staff-live` API는 쓰지 않음).

### 확인 방법
`npm run dev -- --port 5199 --host 127.0.0.1` 후 주소 끝에 `?demo=1`(참여한 계정) / `?demo=2`(새 계정) / `?demo=0`(끄기).
헤드리스 캡처: `chrome --headless=new --window-size=620,1000 --virtual-time-budget=8000 --screenshot=파일 URL` (주최자 화면은 1500x1000).

### 공용 조각
`components/mobile/`(MobileLayout, MobileUi, MobileFooter, MIcon, mobile.css의 mb-*), `utils/useAsync.js`, `utils/mobileFormat.js`, `utils/demo.js`.

### 주의
Bash 도구에서 큰 heredoc이 깨질 수 있으니 파일은 Write 도구로 만든다. 데모 모드는 `api/client.js`가 서버 호출을 막고 `EventProvider`가 샘플 행사를 준다.
