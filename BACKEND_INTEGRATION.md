# 백엔드 연동 가이드

> **현재 상태:** 회원가입·로그인·로그아웃(인증)만 **실제 백엔드(`backend-main`)와 연결**되어 있습니다
> ([0장](#0-인증-백엔드-연동-완료) 참고). 부스·공지·행사·지도 데이터는 백엔드 API가 아직 없어서
> **가짜 데이터(목)** 로 동작합니다.

이 문서는 나머지 기능에 백엔드를 붙일 때 어디를 바꾸면 되는지, 어떤 데이터 모양과 변수가
약속되어 있는지를 정리한 것입니다. (백엔드 코드는 이 저장소에 없습니다. 인증을 제외한 아래
엔드포인트는 *제안*일 뿐 구현된 것이 아닙니다.)

## 0. 인증 (백엔드 연동 완료)

백엔드 `backend-main`의 인증 API를 그대로 사용합니다. (프론트가 백엔드를 수정하지 않습니다.)

### 실행

| 순서 | 위치 | 명령 |
|---|---|---|
| 1 | `backend-main` | `docker compose up -d --wait db` |
| 2 | `backend-main` | `.\gradlew.bat bootRun` (JDK 21 필요) |
| 3 | `moong-techtoon` | `npm run dev` |

백엔드가 꺼져 있으면 로그인·회원가입은 "서버에 연결할 수 없어요" 문구가 나옵니다.
(백엔드 없이 프론트만 배포한 경우도 같습니다: `/api`가 404이거나 JSON이 아닌 응답이면 "서버가 없다"로 보고
이 문구를 보여줍니다. 백엔드의 오류는 항상 JSON이라 구분할 수 있습니다.)
`npm run preview`는 개발 서버의 프록시 설정을 그대로 써서 실제 백엔드로 요청이 갑니다.

### 연결 방식

- 백엔드에는 CORS 설정이 없어서, `vite.config.js`의 **개발 서버 프록시**가 `/api/*`를
  `http://127.0.0.1:8080`으로 넘깁니다. 브라우저는 프론트 주소만 호출하므로 세션 쿠키가 정상 동작합니다.
  (배포할 때는 같은 도메인 아래 `/api`로 묶거나 백엔드에 CORS를 추가해야 합니다.)
- 모든 호출은 `src/api/client.js`를 거칩니다. POST 요청은 `GET /api/auth/csrf`로 받은 토큰을
  헤더에 자동으로 붙이고, 로그인·로그아웃으로 토큰이 바뀌면 다시 받아옵니다(403이면 한 번 재시도).
- 로그인 상태는 `AuthProvider`(`useAuth()`)가 들고 있습니다. 새로고침하면 `GET /api/me`로 세션을 복원합니다.
  어떤 요청이든 401을 받으면 로그아웃 상태로 돌아갑니다.

### 사용하는 API

| 화면 | 호출 | 파일 |
|---|---|---|
| 회원가입 — 중복 확인 | `GET /api/auth/login-id-availability?loginId=` | `src/api/authApi.js` `checkLoginId` |
| 회원가입 — 가입 | `POST /api/auth/sign-up` → `{ accountId }` | `signUp` |
| 로그인 | `POST /api/auth/login` → 이어서 `GET /api/me` | `login`, `getMe` |
| 로그아웃 | `POST /api/auth/logout` | `logout` |

가입 요청 본문: `onboardingType`(`ORGANIZER`/`OPERATOR`), `loginId`, `password`, `nickname`,
`phoneNumber`, `email` — **모두 필수**입니다. 전화번호는 **하이픈 없이 숫자만**(`01012345678`) 받고 보냅니다.
입력칸에서 하이픈·공백·문자는 입력하는 즉시(붙여넣기 포함) 지워집니다. 부스 목록의 가짜 신청자 전화번호도 같은 형식입니다.

### 입력 규칙 (백엔드 DTO와 동일, `src/utils/validators.js`)

| 항목 | 규칙 |
|---|---|
| 아이디 | 영문 소문자·숫자·`_` , 4~30자 |
| 비밀번호 | 8자 이상, UTF-8 72바이트 이하 |
| 닉네임 | 필수, 100자 이하 |
| 전화번호 | 숫자 8~15자리, 하이픈 없음 (앞에 `+` 가능) |
| 이메일 | 필수 (이전 화면의 "선택"에서 **필수로 변경** — 백엔드가 요구) |

### 오류 코드 → 화면 문구 (`src/constants/auth.js`)

| 백엔드 `code` | 상태 | 화면 |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | 아이디 또는 비밀번호가 올바르지 않아요. |
| `LOGIN_ID_TAKEN` | 409 | 이미 사용 중인 아이디예요. (아이디 칸에 표시) |
| `VALIDATION_ERROR` | 400 | 입력한 내용을 다시 확인해 주세요. |
| `ACCOUNT_UNAVAILABLE` | 403 | 사용할 수 없는 계정이에요. |
| (네트워크 실패) | - | 서버에 연결할 수 없어요. |

### 화면 보호와 이동

- `/organizer/*` 4개 화면은 `RequireAuth`가 감쌉니다. 로그인하지 않았으면 `/login`으로 보내고,
  로그인하면 원래 가려던 페이지로 돌려보냅니다. 돌아갈 곳이 없으면 **대시보드**(`HOME_PATH`)로 갑니다.
- 로그인한 상태로 `/login`을 열면 대시보드로 이동합니다.
- 상단 바의 사용자 영역은 로그인한 **닉네임**을 보여주고, 누르면 닉네임·이메일·**로그아웃** 메뉴가 열립니다.
- 랜딩 화면은 로그인하면 "○○님, 환영해요!"와 **로그아웃** 버튼으로 바뀝니다.

### ⚠️ 알려진 한계

1. **주최자와 부스 운영자를 구분하지 못합니다.** 가입 때 `onboardingType`(`ORGANIZER`/`OPERATOR`)을
   보내지만 백엔드가 **저장하지 않고**, `/api/me`와 로그인 응답에도 없습니다. 그래서 로그인하면
   **누구나 같은 곳(대시보드)** 으로 가고, 어느 계정으로 가입했는지에 따라 달라지지 않습니다.
   → 백엔드가 가입 유형을 저장하고 `/api/me`로 돌려주면, 로그인 후 이동을 유형별로 나누세요
   (`src/constants/auth.js`의 `HOME_PATH`, `LoginPage`의 이동 부분).
2. **부스 운영자 전용 화면이 아직 없습니다.** 운영자 계정으로 로그인해도 지금은 주최자 화면이 열립니다.
3. **전화번호 인증, 아이디/비밀번호 찾기는 백엔드에 없습니다.** 해당 버튼은 비활성(또는 동작 없음)이며
   가입을 막지 않습니다.
4. **주최자 화면의 데이터는 계정과 무관합니다.** 로그인만 하면 누구나 같은 가짜 부스·공지·행사를 봅니다.
   (백엔드에 행사·부스 API와 조직·권한이 생기면 계정별 데이터로 바꿔야 합니다.)
5. 세션은 서버 메모리에 있어서 백엔드를 재시작하면 로그인이 풀립니다(계정은 DB에 남아 있음).

## 1. 폴더 구조 (데이터 관련)

| 경로 | 역할 |
|---|---|
| `src/api/client.js` | 백엔드 호출 공통 (CSRF 자동 처리, 오류 코드, 401 처리) |
| `src/api/authApi.js` | 인증 API 함수 (`checkLoginId`, `signUp`, `login`, `getMe`, `logout`) |
| `src/context/AuthProvider.jsx` | 로그인 상태 저장소 (`useAuth()` → `user`, `ready`, `login`, `logout`) |
| `src/components/RequireAuth.jsx` | 로그인해야 열리는 화면 보호 |
| `src/components/SignupForm.jsx` | 두 회원가입 화면이 같이 쓰는 폼 (검증·중복 확인·가입 요청) |
| `src/constants/auth.js` | 인증 규칙·오류 문구·가입 유형 코드 |
| `src/utils/validators.js` | 입력 검증 (백엔드 DTO와 동일한 규칙) |
| `src/constants/recruit.js` | 모집 상태(모집 중/모집 마감/비공개) 코드·라벨과 입력 제한 |
| `src/mocks/recruit.js` | **가짜 모집 공고.** 백엔드가 붙으면 삭제 |
| `src/context/RecruitProvider.jsx` | 모집 공고의 **유일한 저장소** (`useRecruit()` → `recruit`, `updateRecruit`, `setPublished`) |
| `src/utils/recruit.js` | 공개 여부와 마감일로 상태를 계산하는 `getRecruitStatus` |
| `src/pages/RecruitPage.jsx` | 부스 모집 (공고 작성 · 신청 현황 · 미리보기 · 공개/종료) |
| `src/pages/LivePage.jsx` | 실시간 운영 현황 (운영 상태·메뉴 재고 변경, 배치 현황, 지도에서 부스 위치) |
| `src/context/MapProvider.jsx` | 지도(평면도 `image` + 핀 `pins`)의 **유일한 저장소** (`useMap()`). 지도 제작이 쓰고 실시간 운영 현황이 읽음 |
| `src/components/FloorMap.jsx` | 평면도 위에 핀을 그려주는 읽기 전용 지도 (원본 이미지 픽셀 좌표 → % 위치) |
| `src/components/MenuSelect.jsx` | 운영 상태·재고 단계를 고르는 드롭다운 |
| `src/constants/booth.js` | 부스 상태·카테고리의 **코드 값**(백엔드와 주고받는 값)과 화면용 **한글 라벨** |
| `src/constants/map.js` | 핀 종류(`PIN_TYPE`)와 "핀 생성하기" 목록(`FACILITIES`) |
| `src/types.js` | `Booth`, `Pin`, `Floorplan` 모델 정의 (JSDoc) |
| `src/mocks/booths.js` | **가짜 부스 신청 18건.** 백엔드가 붙으면 삭제 |
| `src/context/BoothsProvider.jsx` | 부스 목록의 **유일한 저장소**. 페이지들은 `useBooths()`로만 읽고 바꿈 |
| `src/pages/BoothManagePage.jsx` | 부스 관리 (신청 목록·상세·승인/반려) |
| `src/pages/OrganizerMapPage.jsx` | 지도 제작 (평면도·핀·부스 할당) |
| `src/constants/notice.js` | 공지 상태·대상 코드 값과 한글 라벨, 이미지 제한(10MB, PNG/JPG) |
| `src/mocks/notices.js` | **가짜 공지 5건.** 백엔드가 붙으면 삭제 |
| `src/context/NoticesProvider.jsx` | 공지 목록의 **유일한 저장소** (`useNotices()`) |
| `src/pages/NoticePage.jsx` | 공지사항 (열람 · 작성 · 수정) |
| `src/constants/event.js` | 행사 진행 상태(진행 예정/진행 중/진행 종료) 코드와 한글 라벨 |
| `src/utils/event.js` | 날짜로 진행 상태를 계산하는 `getEventProgress` |
| `src/mocks/event.js` | **가짜 행사 정보** (이름·일정·장소·모집·초대 코드/링크). 백엔드가 붙으면 삭제 |
| `src/context/EventProvider.jsx` | 행사 정보의 **유일한 저장소** (`useEvent()` → `event`, `updateEvent`). 사이드바·대시보드·초대 링크가 같이 읽음 |
| `src/components/EventEditModal.jsx` | 행사 정보 수정 창 (이미지·이름·날짜·장소·소개) |
| `src/pages/DashboardPage.jsx` | 대시보드 (행사 정보 · 모집 현황 · 부스 운영 요약 · 최근 공지 · 초대/방문객 링크) |
| `src/utils/notice.js` | 공지 목록·대시보드가 같이 쓰는 정렬(`sortNotices`)·대상 문구(`audienceText`) |

> 화면 문구는 한글 라벨이지만, **서버와 주고받는 값은 항상 코드 값**(`'approved'` 등)입니다.
> 라벨을 바꿔도 API는 영향받지 않습니다.

## 2. 데이터 모델

### Booth (부스 신청)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | **부스 고유 id.** 지도 핀이 `boothId`로 참조 |
| `name` | string | 부스명 |
| `category` | `'food' \| 'drink' \| 'experience' \| 'goods'` | 음식 / 음료 / 체험 / 굿즈 |
| `status` | `'pending' \| 'approved' \| 'rejected'` | 검토 중 / 승인 / 반려 |
| `appliedAt` | string | 신청일, `YYYY-MM-DD` |
| `boothNo` | number \| null | 부스 번호. **승인 상태일 때만** 값이 있음 |
| `menus` | `{ id, name, stock }[]` | 메뉴와 재고 단계. `stock`은 `unlimited`(무제한) / `plenty`(충분) / `low`(부족) / `soldout`(품절) |
| `statusChangedAt` | string | 운영 상태나 메뉴 재고가 마지막으로 바뀐 시각 `YYYY-MM-DDTHH:mm` (화면에는 시:분만 표시) |
| `operatingStatus` | `'preparing' \| 'open' \| 'soldout' \| 'closed' \| null` | 당일 운영 상태: 준비 중 / 운영 중 / 품절 / 마감. **승인된 부스만** 값이 있고, 승인되는 순간 `preparing`으로 시작 |
| `intro` | string | 운영 소개 |
| `applicant` | `{ name, phone, email }` | 신청자 정보 |
| `documents` | `{ id, name, url }[]` | 제출 서류 |
| `reviewMemo` | string | 검토 메모 (**주최사 전용**) |
| `rejectReason` | string | 반려 사유 (**주최사·운영자에게 공개**) |

규칙
- `pending`은 "승인도 반려도 누르지 않은 상태"입니다. 같은 결정 버튼을 다시 누르면 `pending`으로
  돌아갑니다(토글).
- `approved`를 벗어나면(취소·반려) `boothNo`와 `operatingStatus`는 `null`이 되어야 합니다.
- **지도 제작의 "승인된 부스 할당" 목록은 `status === 'approved'`인 부스만** 보여줍니다.

### Event (행사)

사이드바 상단 카드와 대시보드가 같은 값을 씁니다. (`src/mocks/event.js`)

**진행 상태는 저장하지 않습니다.** 날짜로 계산합니다: 오늘이 `startDate`보다 앞이면 *진행 예정*, `startDate`~`endDate`(종료일 당일 포함)이면 *진행 중*, `endDate` 다음 날부터는 *진행 종료*. 서버가 상태 필드를 내려준다면 이 규칙과 같은 기준이어야 합니다. (프론트는 사용자 PC의 오늘 날짜를 쓰므로, 서버 기준 시간대가 필요하면 서버 시각으로 계산해 내려주세요.)

| 필드 | 타입 | 설명 |
|---|---|---|
| `name` | string | 행사 이름 |
| `startDate`, `endDate` | string | `YYYY-MM-DD` |
| `venue` | string | 장소 |
| `imageUrl` | string \| null | 행사 대표 이미지 (대시보드 행사 카드). 없으면 임시 그림. 지금은 브라우저 임시 `blob:` 주소 |
| `intro` | string | 행사 소개 (줄바꿈 유지) |
| `recruitDeadline` | string | 부스 모집 마감 `YYYY-MM-DDTHH:mm` |
| `recruitTarget` | number | 모집 부스 수(팀) |
| `inviteCode`, `inviteUrl` | string | 부스 운영자 초대 코드 / 링크 (부스 관리의 **초대 링크 복사**도 같은 값) |
| `visitorUrl` | string | 방문객용 링크 (QR에 담길 주소) |

### Recruitment (부스 모집 공고)

| 필드 | 타입 | 설명 |
|---|---|---|
| `published` | boolean | 부스 운영자에게 공개 중인지 |
| `intro` | string | 소개글 (최대 300자, 줄바꿈 유지) |
| `imageUrl` | string \| null | 대표 이미지 (선택). 지금은 브라우저 임시 `blob:` 주소 |
| `categories` | `('food' \| 'drink' \| 'experience' \| 'goods')[]` | 모집 카테고리 (1개 이상) |
| `feeInfo` | string | 참가비 안내 (최대 60자) |
| `documents` | `{ id, label, required }[]` | 필요 서류. `required`가 체크된 것만 신청 때 제출. 기본 2개(운영계획서, 보건증) + 직접 추가(최대 10개, 이름 30자) |
| `contact` | string | 문의 연락처 (자유 텍스트, 최대 80자) |

**모집 마감일과 모집 부스 수는 이 모델에 없습니다.** 대시보드도 보여주기 때문에 `Event.recruitDeadline`,
`Event.recruitTarget`에 있고, 모집 화면의 저장이 두 곳(`updateEvent` + `updateRecruit`)에 나눠 반영됩니다.
서버에서도 같은 값을 쓰거나, 모집 API가 두 값을 함께 받아 Event에 반영하면 됩니다.

**모집 상태는 저장하지 않습니다.** 계산합니다: 비공개(`published=false`) / 모집 중(공개 + 마감 전) /
모집 마감(공개 + 마감일 지남). 서버가 상태 필드를 내려준다면 같은 기준이어야 합니다.

**화면의 숫자는 다른 데이터에서 계산합니다.** 접수된 신청 = 부스 신청 전체, 검토 중/승인/반려 = 부스 상태별 수.
그래서 부스 관리·지도 제작·대시보드와 항상 같습니다.

### Notice (공지)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 공지 id (지금은 프론트가 만든 임시 번호 → 서버가 발급) |
| `title` | string | 제목 (최대 60자) |
| `body` | string | 본문. 줄바꿈 유지 |
| `attachments` | `{ id, name, size, url }[]` | 첨부 파일 (선택, 최대 5개). 이미지는 본문 아래에 바로 보이고 나머지는 다운로드. `url`은 지금 브라우저 임시 `blob:` 주소 |
| `audiences` | `('staff' \| 'booth' \| 'visitor')[]` | 공지 대상: 스태프 / 부스 운영자 / 일반 방문객. 게시하려면 1개 이상 |
| `urgent` | boolean | 긴급 공지. 해당 대상의 공지 목록 최상단에 노출 |
| `status` | `'published' \| 'closed' \| 'draft'` | 게시 중 / 게시 종료 / 임시 저장 |
| `publishedAt` | string \| null | 처음 게시된 시각 `YYYY-MM-DDTHH:mm`. 임시 저장만 된 공지는 `null` |
| `updatedAt` | string | 마지막 수정 시각 `YYYY-MM-DDTHH:mm` |

규칙
- **임시 저장**은 제목만 있으면 가능, **게시**는 제목·본문·대상(1개 이상)이 모두 필요합니다.
- 처음 게시될 때 `publishedAt`을 찍고, 이후 수정·종료·재게시에서는 유지합니다.
- 목록 정렬: **게시 중인 긴급 공지가 맨 위**, 나머지는 `publishedAt`(없으면 `updatedAt`) 최신순.
- 방문객/운영자 앱에서는 `status === 'published'`이면서 자기 대상이 `audiences`에 포함된 공지만 보여야 합니다.
- 첨부 가능 확장자: 이미지(png, jpg, jpeg, gif, webp), pdf, 한글(hwp, hwpx), doc/docx, ppt/pptx, xls/xlsx/csv, txt, zip. 파일당 최대 10MB, 최대 5개. 목록은 `src/constants/notice.js`에 있고, 프론트에서도 검사하지만 **서버에서도 검증**해야 합니다(확장자뿐 아니라 실제 내용·용량).

### Pin (지도 위 핀)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 핀 id (지금은 프론트가 만든 임시 번호 → 저장 시 서버가 발급) |
| `type` | `'booth' \| 'toilet' \| 'info' \| 'medical' \| 'etc'` | 핀 종류 |
| `name` | string | 부스를 할당하면 그 부스 이름, 아니면 `''`(미할당) |
| `boothId` | number \| null | 할당된 `Booth.id`. `null`이면 미할당 |
| `x`, `y` | number | **원본 이미지 픽셀 좌표** |

### 좌표계 (중요)
- `x`는 `0 ~ floorplan.width`, `y`는 `0 ~ floorplan.height`, **원점은 이미지 왼쪽 위**입니다.
- 화면 크기·확대/축소·창 크기와 무관한 값이라 그대로 저장/복원하면 됩니다.
- 부스 핀만 `boothId`를 가질 수 있고, 한 부스는 핀 하나에만 할당됩니다.

### Floorplan (평면도 이미지)

| 필드 | 타입 | 설명 |
|---|---|---|
| `url` | string | 이미지 주소 (지금은 브라우저 임시 `blob:` 주소 → 업로드 후 서버 URL) |
| `name` | string | 파일명 |
| `width`, `height` | number | 원본 픽셀 크기. 핀 좌표 계산에 필요하니 **함께 저장** |

## 3. 연결할 위치 (Where to connect)

코드에 `TODO(backend)`로 표시해 두었습니다. 검색: `grep -rn "TODO(backend)" src`

| 화면 동작 | 지금 | 연결할 곳 | 제안 엔드포인트 (미구현) |
|---|---|---|---|
| 부스 목록 불러오기 | `MOCK_BOOTHS` | `BoothsProvider` 초기값 | `GET /booths` → `Booth[]` |
| 승인 / 반려 / 취소 | `setStatus(id, status)` | `BoothsProvider.setStatus` | `PATCH /booths/:id/status` `{ status }` |
| 검토 메모 · 반려 사유 입력 | `editNotes(id, fields)` | `BoothsProvider.editNotes` (입력마다가 아니라 blur 때 저장 권장) | `PATCH /booths/:id/notes` `{ reviewMemo, rejectReason }` |
| 초대 링크 복사 | `/signup/booth` 주소 조합 | `BoothManagePage.copyInvite` | `GET /invite-link` → `{ url }` |
| 행사 정보 불러오기 | `MOCK_EVENT` | `EventProvider` 초기값 | `GET /event` → `Event` |
| 행사 이미지 업로드 | 브라우저 임시 URL | `EventEditModal.loadImage` | `POST /event/image` (multipart) → `{ url }` (PNG/JPG/WEBP/GIF, 최대 10MB — 서버에서도 검증) |
| 행사 정보 수정 (이름·날짜·장소·소개·이미지) | `updateEvent(fields)` | `EventProvider.updateEvent` | `PUT /event` (수정한 필드만 보내도 됨) |
| 초대 코드·링크, 방문객 링크 | `event.inviteCode` 등 | `DashboardPage`, `BoothManagePage.copyInvite` (모두 `useEvent()`) | `GET /event` 응답에 포함 |
| 방문객 QR | 임시 그림 | `DashboardPage.QrPlaceholder` | 서버가 QR 이미지 생성 또는 프론트 QR 라이브러리 |
| 부스 운영 상태 변경 (준비 중/운영 중/품절/마감) | `setOperatingStatus(id, status)` | `BoothsProvider.setOperatingStatus` (실시간 운영 현황의 상태 버튼) | `PATCH /booths/:id/operating-status` `{ operatingStatus }` |
| 메뉴 재고 변경 | `setMenuStock(id, menuId, stock)` | `BoothsProvider.setMenuStock` (부스 상세의 재고 버튼) | `PATCH /booths/:id/menus/:menuId` `{ stock }` |
| 실시간 갱신 (30초마다 + 새로고침) | 시각만 갱신 | `LivePage`의 `refresh` / 자동 갱신 타이머 | 부스 목록(운영 상태·재고)을 다시 요청. 폴링이면 충분, 더 빠르게는 SSE/WebSocket |
| 모집 공고 불러오기 / 저장 | `MOCK_RECRUIT`, `updateRecruit(fields)` | `RecruitProvider` (+ 마감일·부스 수는 `EventProvider.updateEvent`) | `GET /recruitment`, `PUT /recruitment` |
| 모집 공개 / 공개 종료 | `setPublished(bool)` | `RecruitProvider.setPublished` | `PATCH /recruitment/publish` `{ published }` |
| 모집 대표 이미지 | 브라우저 임시 URL | `RecruitPage.loadImage` | `POST /recruitment/image` (multipart) → `{ url }` |
| 공지 목록 불러오기 | `MOCK_NOTICES` | `NoticesProvider` 초기값 | `GET /notices` → `Notice[]` |
| 공지 작성 / 수정 / 임시 저장 | `saveNotice(id, fields, status)` | `NoticesProvider.saveNotice` (`id`가 `null`이면 생성) | `POST /notices`, `PUT /notices/:id` |
| 게시 종료 / 다시 게시 | `closeNotice` / `reopenNotice` | `NoticesProvider.setStatus` | `PATCH /notices/:id/status` `{ status }` |
| 공지 삭제 | `deleteNotice(id)` | `NoticesProvider.deleteNotice` | `DELETE /notices/:id` |
| 공지 파일 첨부 | 브라우저 임시 URL | `NoticePage.addFiles` | `POST /notices/attachments` (multipart) → `{ id, name, size, url }` |
| 평면도·핀 불러오기 | 없음 (`MapProvider` state) | `MapProvider` 초기값 | `GET /map` → `{ floorplan, pins }` |
| 지도 **저장하기** | 버튼만 있음 (동작 없음) | `OrganizerMapPage`의 저장 버튼 (`MapProvider`의 `image`, `pins`를 보냄) | `PUT /map` `{ floorplan, pins }` |
| 평면도 업로드 | 브라우저 임시 URL | `OrganizerMapPage.loadFile` | `POST /map/floorplan` (multipart) → `{ url }` |

## 4. 상태가 어디에 있나

| 데이터 | 위치 | 비고 |
|---|---|---|
| 부스 목록 (`booths`) | `BoothsProvider` (앱 전체 공유) | 승인/반려가 지도 제작에 바로 반영됨 |
| 모집 공고 (`recruit`) | `RecruitProvider` (앱 전체 공유) | 대시보드의 모집 상태가 같은 값을 읽음. 마감일·부스 수는 `EventProvider` |
| 모집 화면의 입력 중인 내용 | `RecruitPage`의 state (`form`) | **저장하기를 눌러야** 위 저장소에 반영됨. 저장하지 않으면 사라짐 |
| 공지 목록 (`notices`) | `NoticesProvider` (앱 전체 공유) | 방문객/운영자 화면이 생기면 같은 데이터를 대상별로 필터해서 사용 |
| 평면도 (`image`), 핀 (`pins`) | `MapProvider` (앱 전체 공유) | 다른 화면으로 가도 유지됨(실시간 운영 현황이 읽음). **새로고침하면 사라짐.** 저장/불러오기 연결 필요 |
| 선택한 핀·부스, 필터, 페이지, 탭 | 각 페이지의 state | 화면 전용이라 서버와 무관 |

## 5. 백엔드를 붙일 때 순서 (권장)

1. `src/mocks/booths.js`를 삭제하고 `BoothsProvider`의 초기 목록을 서버 응답으로 교체
   (로딩/오류 상태가 필요하면 Provider에 추가).
2. `setStatus` / `editNotes` 안에서 API 호출. 실패하면 이전 값으로 되돌리는 방식을 권장.
3. `OrganizerMapPage`에 `GET /map`·`PUT /map`·이미지 업로드 연결. 저장 후 핀 id를 서버 값으로 교체.
4. `NoticesProvider`도 같은 방식으로 연결 (`saveNotice`는 서버가 발급한 id를 돌려받아 반환).
5. 부스를 핀에 할당할 때(`boothId` 지정) `Booth.boothNo`를 어떻게 부여할지 정책 결정 필요
   (지금은 두 값이 연결되어 있지 않음).

## 6. 아직 화면만 있고 동작이 없는 부분

- 실시간 운영 현황: 운영 상태·메뉴 재고 변경과 "최근 갱신" 시각은 화면 안에서만 반영됨(새로고침하면 처음 값). **자동 갱신 중/새로고침**은 지금 시각만 바꿈 — 가져올 서버 데이터가 아직 없음(`TODO(backend)`). 메뉴·재고는 가짜 데이터이고, **재고를 바꿔도 운영 상태가 자동으로 바뀌지는 않음**(모두 품절이어도 운영 중일 수 있음)
- 실시간 운영 현황의 **배치 / 부스 위치**는 지도 제작의 핀(`pins[].boothId`)에서 계산됨. 지도 제작에서 핀을 만들고 부스를 할당해야 "배치 완료"로 보임

- 대시보드: **모집 관리**, **운영 현황 보기**, **QR 복사** 버튼, 방문객 QR(임시 그림). **행사 정보 수정**은 화면에서 동작하지만 저장은 화면 안에서만 반영됨(새로고침하면 처음 값)
- 대시보드의 숫자는 별도로 저장하지 않고 **부스 목록·공지 목록에서 계산**합니다 (전체 부스 = 승인된 부스, 신청 수 = 전체 신청, 운영 중/준비 중/품절/마감 = 승인된 부스의 `operatingStatus`). 백엔드도 같은 기준으로 집계하거나 목록을 그대로 내려주면 됩니다.
- 최근 공지 = 임시 저장을 제외한 공지를 목록과 같은 순서(`sortNotices`)로 정렬한 앞 3개

- 부스 모집: 저장·공개가 화면 안에서만 반영됨. **부스 모집 바로가기**는 부스 관리로 이동(운영자용 공개 모집 페이지는 아직 없음). 운영자가 보는 실제 공고 화면 없음 — **미리보기**만 있음
- 부스 관리: **+ 부스 직접 등록**, 제출 서류 **보기** 버튼
- 공지사항: 저장·게시가 화면 안에서만 반영됨(새로고침하면 처음 상태). 알림 발송 없음
- 지도 제작: **저장하기**, **미리보기**
- 상단 바의 알림·사용자 메뉴, 사이드바의 대시보드/부스 모집/실시간 운영 현황/공지사항/정산 관리
- 로그인 화면의 **아이디 찾기 / 비밀번호 찾기**, 회원가입의 **전화번호 인증**(백엔드에 기능 없음)

## 7. 환경 변수

사용하는 환경 변수는 없습니다. API 주소는 `vite.config.js`의 프록시(`/api` → `http://127.0.0.1:8080`)로
정해져 있습니다. 백엔드 포트를 바꿔 실행했다면(`--server.port=8081`) 그 파일의 주소도 같이 바꾸세요.
