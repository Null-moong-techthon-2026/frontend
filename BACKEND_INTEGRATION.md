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
| `intro` | string | 운영 소개 |
| `applicant` | `{ name, phone, email }` | 신청자 정보 |
| `documents` | `{ id, name, url }[]` | 제출 서류 |
| `reviewMemo` | string | 검토 메모 (**주최사 전용**) |
| `rejectReason` | string | 반려 사유 (**주최사·운영자에게 공개**) |

규칙
- `pending`은 "승인도 반려도 누르지 않은 상태"입니다. 같은 결정 버튼을 다시 누르면 `pending`으로
  돌아갑니다(토글).
- `approved`를 벗어나면(취소·반려) `boothNo`는 `null`이 되어야 합니다.
- **지도 제작의 "승인된 부스 할당" 목록은 `status === 'approved'`인 부스만** 보여줍니다.

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
| 평면도·핀 불러오기 | 없음 (페이지 state) | `OrganizerMapPage` 초기 state | `GET /map` → `{ floorplan, pins }` |
| 지도 **저장하기** | 버튼만 있음 (동작 없음) | `OrganizerMapPage`의 저장 버튼 | `PUT /map` `{ floorplan, pins }` |
| 평면도 업로드 | 브라우저 임시 URL | `OrganizerMapPage.loadFile` | `POST /map/floorplan` (multipart) → `{ url }` |

## 4. 상태가 어디에 있나

| 데이터 | 위치 | 비고 |
|---|---|---|
| 부스 목록 (`booths`) | `BoothsProvider` (앱 전체 공유) | 승인/반려가 지도 제작에 바로 반영됨 |
| 평면도 (`image`), 핀 (`pins`) | `OrganizerMapPage`의 state | **페이지를 벗어나면 사라짐.** 저장/불러오기 연결 필요 |
| 선택한 핀·부스, 필터, 페이지, 탭 | 각 페이지의 state | 화면 전용이라 서버와 무관 |

## 5. 백엔드를 붙일 때 순서 (권장)

1. `src/mocks/booths.js`를 삭제하고 `BoothsProvider`의 초기 목록을 서버 응답으로 교체
   (로딩/오류 상태가 필요하면 Provider에 추가).
2. `setStatus` / `editNotes` 안에서 API 호출. 실패하면 이전 값으로 되돌리는 방식을 권장.
3. `OrganizerMapPage`에 `GET /map`·`PUT /map`·이미지 업로드 연결. 저장 후 핀 id를 서버 값으로 교체.
4. 부스를 핀에 할당할 때(`boothId` 지정) `Booth.boothNo`를 어떻게 부여할지 정책 결정 필요
   (지금은 두 값이 연결되어 있지 않음).

## 6. 아직 화면만 있고 동작이 없는 부분

- 부스 관리: **+ 부스 직접 등록**, 제출 서류 **보기** 버튼
- 지도 제작: **저장하기**, **미리보기**
- 상단 바의 알림·사용자 메뉴, 사이드바의 대시보드/부스 모집/실시간 운영 현황/공지사항/정산 관리
- 로그인·회원가입 화면(`src/pages/LoginPage.jsx` 등)은 폼만 있고 인증 처리가 없음

## 7. 환경 변수

아직 사용하는 환경 변수는 없습니다. API 주소가 정해지면 `VITE_API_BASE_URL`처럼 `VITE_` 접두사를
붙인 변수로 두고 `import.meta.env`로 읽으면 됩니다.
