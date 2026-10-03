# 백엔드 연동 가이드

프론트엔드는 **지금 백엔드 없이 가짜 데이터(목)로 동작**합니다. 이 문서는 백엔드를 붙일 때 어디를
바꾸면 되는지, 어떤 데이터 모양과 변수가 약속되어 있는지를 정리한 것입니다. (백엔드 코드는 이
저장소에 없습니다. 아래 엔드포인트는 *제안*일 뿐 구현된 것이 아닙니다.)

## 1. 폴더 구조 (데이터 관련)

| 경로 | 역할 |
|---|---|
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
| 부스 운영 상태 변경 (운영 중/품절/마감) | 변경 화면 없음 | (추가 필요) | `PATCH /booths/:id/operating-status` |
| 공지 목록 불러오기 | `MOCK_NOTICES` | `NoticesProvider` 초기값 | `GET /notices` → `Notice[]` |
| 공지 작성 / 수정 / 임시 저장 | `saveNotice(id, fields, status)` | `NoticesProvider.saveNotice` (`id`가 `null`이면 생성) | `POST /notices`, `PUT /notices/:id` |
| 게시 종료 / 다시 게시 | `closeNotice` / `reopenNotice` | `NoticesProvider.setStatus` | `PATCH /notices/:id/status` `{ status }` |
| 공지 삭제 | `deleteNotice(id)` | `NoticesProvider.deleteNotice` | `DELETE /notices/:id` |
| 공지 파일 첨부 | 브라우저 임시 URL | `NoticePage.addFiles` | `POST /notices/attachments` (multipart) → `{ id, name, size, url }` |
| 평면도·핀 불러오기 | 없음 (페이지 state) | `OrganizerMapPage` 초기 state | `GET /map` → `{ floorplan, pins }` |
| 지도 **저장하기** | 버튼만 있음 (동작 없음) | `OrganizerMapPage`의 저장 버튼 | `PUT /map` `{ floorplan, pins }` |
| 평면도 업로드 | 브라우저 임시 URL | `OrganizerMapPage.loadFile` | `POST /map/floorplan` (multipart) → `{ url }` |

## 4. 상태가 어디에 있나

| 데이터 | 위치 | 비고 |
|---|---|---|
| 부스 목록 (`booths`) | `BoothsProvider` (앱 전체 공유) | 승인/반려가 지도 제작에 바로 반영됨 |
| 공지 목록 (`notices`) | `NoticesProvider` (앱 전체 공유) | 방문객/운영자 화면이 생기면 같은 데이터를 대상별로 필터해서 사용 |
| 평면도 (`image`), 핀 (`pins`) | `OrganizerMapPage`의 state | **페이지를 벗어나면 사라짐.** 저장/불러오기 연결 필요 |
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

- 대시보드: **모집 관리**, **운영 현황 보기**, **QR 복사** 버튼, 방문객 QR(임시 그림). **행사 정보 수정**은 화면에서 동작하지만 저장은 화면 안에서만 반영됨(새로고침하면 처음 값)
- 대시보드의 숫자는 별도로 저장하지 않고 **부스 목록·공지 목록에서 계산**합니다 (전체 부스 = 승인된 부스, 신청 수 = 전체 신청, 운영 중/준비 중/품절/마감 = 승인된 부스의 `operatingStatus`). 백엔드도 같은 기준으로 집계하거나 목록을 그대로 내려주면 됩니다.
- 최근 공지 = 임시 저장을 제외한 공지를 목록과 같은 순서(`sortNotices`)로 정렬한 앞 3개

- 부스 관리: **+ 부스 직접 등록**, 제출 서류 **보기** 버튼
- 공지사항: 저장·게시가 화면 안에서만 반영됨(새로고침하면 처음 상태). 알림 발송 없음
- 지도 제작: **저장하기**, **미리보기**
- 상단 바의 알림·사용자 메뉴, 사이드바의 대시보드/부스 모집/실시간 운영 현황/공지사항/정산 관리
- 로그인·회원가입 화면(`src/pages/LoginPage.jsx` 등)은 폼만 있고 인증 처리가 없음

## 7. 환경 변수

아직 사용하는 환경 변수는 없습니다. API 주소가 정해지면 `VITE_API_BASE_URL`처럼 `VITE_` 접두사를
붙인 변수로 두고 `import.meta.env`로 읽으면 됩니다.
