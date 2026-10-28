# 백엔드 연동 가이드

> **현재 상태:** 주최자 화면 전체(인증 · 행사 · 대시보드 · 부스 모집 · 부스 관리 · 지도 제작 · 실시간 운영 현황 ·
> 공지사항)가 **실제 백엔드(`backend-main`)와 연결**되어 있습니다. 가짜 데이터(`mocks/`)는 모두 없앴습니다.
> **부스 운영자·방문객이 직접 쓰는 기능**(운영자 신청, 초대 코드로 모집 정보 보기, 내 부스 운영, 방문객 화면)은
> 프론트 화면이 아직 없어서 연결하지 않았습니다. ([6장](#6-아직-연결하지-않은-것))

백엔드 계약의 원본은 `backend-main/docs/API_DRAFT.md`(목표 계약)와 `WORKFLOW_TEST.md`(화면 흐름 테스트)입니다.
이 문서는 **프론트 쪽이 어떤 API를 어디서 어떻게 쓰는지**를 정리한 것입니다. (프론트가 백엔드를 수정하지 않습니다.)

## 0. 실행과 연결 방식

| 순서 | 위치 | 명령 |
|---|---|---|
| 1 | `backend-main` | `docker compose up -d --wait db` |
| 2 | `backend-main` | `.\gradlew.bat bootRun` (JDK 21 필요, **`local` 프로필**) |
| 3 | `moong-techtoon` | `npm run dev` |

- 업무 API(행사·모집·신청·부스·지도·공지)는 **`local` 프로필에서만** 열려 있습니다. `deploy` 프로필에는 없습니다.
- 개발 서버 프록시(`vite.config.js`)가 `/api/*`를 `http://127.0.0.1:8080`으로 넘깁니다. 브라우저는 프론트 주소만
  호출하므로 세션 쿠키가 정상 동작합니다. (백엔드의 `LocalCorsConfig`는 `http://127.0.0.1:5173`만 허용하므로, 프록시 없이
  직접 부르려면 그 주소로 접속해야 합니다.)
- 모든 호출은 `src/api/client.js`를 거칩니다. 변경 요청(POST/PUT/PATCH/DELETE)은 `GET /api/auth/csrf`로 받은 토큰을
  헤더에 자동으로 붙이고, 로그인·로그아웃으로 토큰이 바뀌면 다시 받습니다(403이면 한 번 재시도). `FormData`(파일 업로드)도
  지원합니다. 401을 받으면 로그아웃 상태로 돌아갑니다.
- 백엔드가 꺼져 있으면 "서버에 연결할 수 없어요" 문구가 나옵니다(`/api`가 404이거나 JSON이 아닌 응답이면 "서버 없음"으로 봄).
- 오류는 `ApiError(status, code, message)`로 던져지고, `constants/errors.js`의 `apiErrorMessage`가 `code`를 한글로 바꿉니다.
  (로그인·가입 오류는 `constants/auth.js`.)
- 코드 값(`'FOOD'`, `'PENDING'`, `'OPEN'`, `'OTHER_FACILITY'` …)은 **백엔드와 같은 값**을 `constants/`에 그대로 씁니다.
  화면에는 한글 라벨만 따로 붙입니다.

## 1. 어떤 화면이 어떤 API를 쓰나

### 공통
| 동작 | 호출 | 파일 |
|---|---|---|
| 회원가입 · 로그인 · 로그아웃 · 세션 복원 | `/api/auth/*`, `/api/me` | `api/authApi.js`, `AuthProvider` |
| 내 행사 불러오기 | `GET /api/me/events?participation=ORGANIZER` (첫 번째 행사 사용) | `EventProvider` |
| 행사 수정 | `PATCH /api/events/{eventId}` (`revision` 포함) | `EventProvider.updateEvent` |
| 이미지 업로드 | `POST /api/events/{eventId}/media-assets` (multipart, PNG/JPEG 10MB) | `api/eventApi.js uploadImage` |

> 행사는 **프론트에서 만들지 않습니다.** 랜딩의 "행사 개설 신청"을 받은 부스럭 팀이 행사를 만들어 주는 구조입니다. 행사가 없는
> 주최자 계정은 `pages/EventPendingPage.jsx`의 "행사는 아직 열리지 않았어요" 안내를 봅니다. (백엔드에는 행사 개설 신청서를 받는
> API가 아직 없어서, 랜딩의 신청 버튼은 주최자 회원가입으로 이동합니다.)

### 대시보드
| 동작 | 호출 |
|---|---|
| 부스 요약 · 최근 공지 | `GET /events/{id}/dashboard` → `boothSummary`, `recentAnnouncements` |
| 신청 수 | `GET /events/{id}/applications/summary` (`BoothsProvider`) |
| 초대 상태 | `GET /events/{id}/application-invitation` |
| 초대 발급 / 종료 | `POST` (`expiresAt` = 모집 마감 시각) / `DELETE` — `InvitationProvider` |

### 부스 모집 (`RecruitProvider`)
| 동작 | 호출 |
|---|---|
| 불러오기 | `GET /events/{id}/recruitment` |
| 저장 | `PUT /events/{id}/recruitment` — 전체 폼 + `revision` |
| 공개 / 공개 종료 | 같은 `PUT`의 `publicationStatus`. 공개할 때는 행사도 `PATCH publicationStatus=PUBLISHED` |

### 부스 관리 (`pages/BoothManagePage.jsx`)
| 동작 | 호출 |
|---|---|
| 목록 | `GET /events/{id}/applications?page&size=7&q&categoryCode&reviewStatus&sort=submittedAt,desc` |
| 상세 | `GET /events/{id}/applications/{applicationId}` |
| 서류 상태 | `PATCH .../document-checks/{requirementId}` (서류별 `revision`) |
| 검토 메모 | `PATCH .../review-note` (칸을 벗어날 때) |
| 승인 / 반려 | `POST .../decision` (`revision`, `decision`, 반려는 `rejectionReason`) |
| 부스 직접 등록 | `POST /events/{id}/booths` |

### 실시간 운영 현황 (`pages/LivePage.jsx`)
| 동작 | 호출 |
|---|---|
| 목록 + 숫자 (5초 폴링) | `GET /events/{id}/operations?page&size=8&q&operationStatus&stockSummary&placementStatus` |
| 상세 | `GET /events/{id}/booths/{boothId}` (품목, 게시 지도 위치 `mapPlacement`) |
| 운영 상태 | `PATCH .../booths/{boothId}/operation-status` |
| 재고 | `PATCH .../booths/{boothId}/items/{itemId}` (`stockStatus`) |
| 방문객 공개 | `PATCH .../booths/{boothId}` (`visibilityStatus`) |
| 크게 보기 | `GET /public/events/{id}/map` (행사가 공개돼 있고 지도가 게시된 경우, 아니면 `mapPlacement`만) |

### 지도 제작 (`MapProvider`, `pages/OrganizerMapPage.jsx`)
| 동작 | 호출 |
|---|---|
| 불러오기 | `GET /events/{id}/map-editor` → `publishedMap`(핀 없음), `draftMap`(핀 포함) |
| 평면도 올리기 | 업로드 → `POST .../floor-plans {mediaAssetId}` (이미 초안이 있으면 409) |
| 게시본으로 수정 시작 | `POST .../floor-plans {sourceFloorPlanId}` |
| 저장 | `PUT .../floor-plans/{id} {revision, pins}` — **핀 전체**를 보냄(빠진 핀은 삭제됨, 최대 500개) |
| 게시 | `POST .../floor-plans/{id}/publication {revision}` (저장하지 않은 변경은 먼저 저장) |
| 삭제 | `DELETE .../floor-plans/{id}?revision=` (초안만) |
| 배치할 부스 | `GET /events/{id}/booths?size=100` (모든 페이지) |

### 공지사항 (`NoticesProvider`)
| 동작 | 호출 |
|---|---|
| 목록 | `GET /events/{id}/announcements?view=MANAGE&size=100` (모든 페이지, 본문 없음) |
| 열람 | `GET .../announcements/{id}` |
| 작성 / 수정 | `POST` / `PUT` (전체 필드 + `revision`) |
| 게시 종료 / 다시 게시 | `PUT` — 전체 필드를 다시 보내고 `publicationStatus`만 바꿈 |
| 삭제 | `DELETE .../announcements/{id}?revision=` |

## 2. 데이터가 프론트에서 바뀌는 방식

백엔드 응답을 그대로 화면에 쓰지 않고 한 번 변환합니다(`utils/`의 `toEvent`, `toRecruit`, `toNotice`). 주의할 점:

- **날짜/시각**: 백엔드는 ISO 시각(`Instant`)을 씁니다. 화면은 브라우저 시간대의 `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm` 문자열로
  다룹니다(`utils/date.js`). 행사 기간은 시작일 00:00 ~ 종료일 23:59:59로 보내서 종료일 당일도 "진행 중"입니다.
- **행사 진행 상태 · 모집 상태**는 저장하지 않고 날짜로 계산합니다(`getEventProgress`, `getRecruitStatus`).
- **`revision`**: 수정 가능한 자원은 마지막으로 본 `revision`을 보내고, 서버가 다르면 409 `REVISION_CONFLICT`를 줍니다.
  화면은 "다른 곳에서 먼저 수정됐어요. 새로고침…" 메시지를 보여 줍니다.
- **지도 핀 좌표**: 백엔드는 0~1 비율(`xRatio`, `yRatio`), 화면은 **원본 이미지 픽셀**입니다. `MapProvider`가 양쪽을
  변환합니다. 핀 id는 프론트가 만든 UUID(`crypto.randomUUID()`)이고 저장 뒤에도 그대로 유지됩니다.
- **공지 상태**: 백엔드는 `DRAFT`/`PUBLISHED`뿐입니다. "게시 종료"는 한 번 게시된 적이 있는(`publishedAt`) 임시 저장입니다.
- **초대 코드**: 서버는 해시만 저장해서 코드를 **발급 응답에서만** 줍니다. `InvitationProvider.issued`가 메모리에만 들고 있다가
  새로고침하면 사라집니다.

## 3. 상태가 어디에 있나

| 데이터 | 위치 | 비고 |
|---|---|---|
| 로그인 사용자 | `AuthProvider` | 새로고침하면 `GET /api/me`로 복원 |
| 현재 행사 | `EventProvider` | 로그인한 사용자의 첫 번째 행사. 없으면 `status:'none'` → "행사는 아직 열리지 않았어요" 안내 |
| 모집 공고 | `RecruitProvider` | 대시보드·모집 화면이 같은 값을 읽음 |
| 초대 | `InvitationProvider` | 상태는 서버, 코드·링크는 발급 직후 메모리에만 |
| 신청 건수 | `BoothsProvider` (`summary`) | 부스 관리가 결정할 때마다 `refreshSummary()` |
| 공지 목록 | `NoticesProvider` | 본문·이미지는 열람할 때 따로 불러옴 |
| 지도 초안 · 핀 | `MapProvider` | 핀 편집은 저장 전까지 화면 상태(`dirty`). 저장 실패 시 화면 상태 유지 |
| 신청 목록 · 운영 목록 · 선택·필터·페이지 | 각 페이지의 state | 서버가 검색·필터·페이지를 처리하므로 페이지가 직접 불러옴 |

Provider는 `App.jsx`에서 `Auth → Event → Recruit → Invitation → Booths → Notices → Map` 순서로 겹쳐 있고, 로그인한 사용자와
행사가 정해지면 각자 데이터를 불러옵니다(`context/useEventData.js`). 로그아웃하면 다른 사용자의 데이터가 보이지 않도록 행사
id를 기준으로 비웁니다.

## 4. 백엔드 규칙 때문에 이전 화면과 달라진 점

| 이전(가짜 데이터) | 지금 |
|---|---|
| 승인/반려를 다시 누르면 검토 중으로 되돌림 | **한 번 결정하면 되돌릴 수 없음**(백엔드 409). 확인 창이 뜸 |
| 부스 번호는 지도 배치 후 부여 | **승인할 때 서버가 부스 번호(B001…)를 자동 부여** |
| 제출 서류 파일 "보기" | 서류는 서비스 밖에서 받음. **상태만 기록**(필수 서류가 모두 "확인 완료"여야 승인) |
| 공지 첨부 파일 여러 개(이미지·PDF 등) | **이미지 1장**(PNG/JPG)만 |
| 부스명순 정렬 | 서버가 지원하는 최신순/오래된순만 |
| 참가비 한 줄 문구 | **금액(원) + 안내 문구**로 나눔 |
| 모집 공고의 "문의 연락처" | 백엔드에 필드가 없어 **삭제** |
| 모집 공고 대표 이미지 | **행사 대표 이미지와 같은 그림**(행사 데이터가 원본). 바꿀 수만 있고 지울 수 없음 |
| 지도 "저장하기" = 끝 | **저장(초안)과 게시를 분리**. 게시해야 방문객에게 보임 |
| 부스는 승인된 신청만 | **직접 등록한 부스**도 운영 현황·지도에 나옴(신청 통계에는 안 들어감) |
| 초대 코드·링크를 항상 표시 | **발급 직후에만** 표시, 이후는 재발급 |
| 재고 현황 "품절 메뉴 n/m" 목록 열 | 목록은 서버가 계산한 **재고 요약**(미등록/무제한/충분/부족/품절), 상세에서만 n/m |

## 5. 알려진 한계

1. **주최자와 부스 운영자를 백엔드가 구분하지 못합니다.** 가입 때 `onboardingType`을 보내지만 백엔드가 저장하지 않고 `/api/me`에도
   없습니다. 그래서 프론트가 대신 알아봅니다(`utils/role.js`, `components/RequireEvent.jsx`): 행사가 없는 계정이 ① 이 브라우저에서
   운영자로 가입했거나 ② 부스 신청(`/api/me/applications`)·부스(`/api/me/booths`)가 있으면 "운영자 전용 화면 준비 중" 안내를 보여 주고,
   아니면 "행사는 아직 열리지 않았어요"를 보여 줍니다. 다른 브라우저에서 로그인하는 갓 가입한 운영자(신청 전)는 구분되지 않습니다.
2. **행사 선택이 없습니다.** 여러 행사를 가진 계정은 가장 최근에 만든 행사만 다룹니다.
3. **행사 개설 신청**은 백엔드와 연동되어 있습니다(8장). 결제·약관 전문·이메일 인증은 아직 없습니다.
4. **전화번호 인증, 아이디/비밀번호 찾기**는 백엔드에 없습니다(해당 버튼은 동작 없음).
5. 세션은 서버 메모리에 있어서 백엔드를 재시작하면 로그인이 풀립니다(계정은 DB에 남음).
6. **방문객 링크·QR**: 방문객 화면이 없어서 링크 주소(`/e/{eventId}`)는 임시이고 QR은 그림입니다.
7. 지도 제작의 **미리보기** 버튼은 아직 동작이 없습니다. 지도 게시본의 이미지는 편집기에서 보여 주지 않습니다(복사해서 수정 시작만 가능).
8. 일시적인 네트워크 오류로 실패한 저장은 자동 재시도하지 않습니다(메시지를 보고 다시 누르기).

## 6. 아직 연결하지 않은 것

부스 운영자·방문객 쪽 API는 백엔드에 있지만 프론트 화면이 없어 연결하지 않았습니다.

| 기능 | 백엔드 API |
|---|---|
| 초대 코드로 모집 정보 확인 | `POST /api/application-invitations/resolve` |
| 공개 행사·모집 | `GET /api/public/events`, `/public/events/{id}`, `/public/events/{id}/recruitment` |
| 부스 프로필 | `/api/me/booth-profiles` |
| 부스 신청 · 내 신청 | `POST /api/events/{id}/applications`, `/api/me/applications` |
| 내 부스 운영 | `GET /api/me/booths`, 부스·품목 수정(운영자 권한), 품목 추가/삭제 |
| 방문객 부스·공지 | `/api/public/events/{id}/booths`, `/announcements` |

위 기능을 붙일 때는 `src/api/`에 함수를 더하고(`boothApi.js` 등에 일부 이미 있음), 운영자용 화면과 로그인 후 역할별 이동을
함께 만들면 됩니다.

## 7. 환경 변수

사용하는 환경 변수는 없습니다. API 주소는 `vite.config.js`의 프록시(`/api` → `http://127.0.0.1:8080`)로 정해져 있습니다.
백엔드 포트를 바꿔 실행했다면(`--server.port=8081`) 그 파일의 주소도 같이 바꾸세요.

## 8. 행사 개설 신청 · 관리자 (백엔드 연동 완료)

행사는 사용자가 직접 만들지 않고, 주최자가 **행사 개설 신청**을 하면 **플랫폼 관리자**가 승인·반려합니다. 승인하면 백엔드가 같은
트랜잭션에서 단체(신청자가 OWNER)와 행사(초안, 빈 모집 공고)를 만들어 주므로 신청자는 바로 대시보드를 쓸 수 있습니다.
(백엔드 설명: `backend-main/docs/EVENT_APPLICATIONS.md`)

| 동작 | 호출 | 프론트 |
|---|---|---|
| 신청 제출 | `POST /api/event-applications` (검토 중인 신청이 있으면 409 `DUPLICATE_APPLICATION`) | `api/eventApplicationApi.js`, `pages/EventApplyPage.jsx` |
| 내 신청 조회 | `GET /api/me/event-applications` (최신순) | `utils/useMyEventApplications.js` |
| 관리자 목록·요약 | `GET /api/admin/event-applications?status=` | `pages/AdminApplicationsPage.jsx` (`/admin/applications`) |
| 승인 / 반려 | `POST /api/admin/event-applications/{id}/decision` (`revision`, `decision`, 반려는 `rejectionReason`) | 같은 페이지 |
| 관리자 여부 | `GET /api/me`의 `platformRole` (`USER` / `ADMIN`) | `user.platformRole` |

로그인한 주최자가 어디로 가는지(`components/RequireEvent.jsx`):

| 상태 | 보이는 화면 |
|---|---|
| 행사가 있음 | 대시보드 등 주최자 화면 |
| 행사 없음 + 신청한 적 없음 | 행사 개설 신청서 (`/apply`) |
| 행사 없음 + 신청 검토 중 | 대기 화면 "승인을 기다리고 있어요" |
| 행사 없음 + 승인됨 (행사가 곧 보임) | 대기 화면 "신청이 승인됐어요" + 다시 확인하기 |
| 행사 없음 + 반려됨 | 신청서에 반려 사유와 "다시 신청하기" |

**관리자 계정 만들기**: 가입 화면으로는 관리자가 될 수 없습니다. 가입한 뒤 DB에서 직접 지정합니다.

```sql
UPDATE app.accounts SET platform_role = 'ADMIN'
WHERE id = (SELECT account_id FROM app.local_credentials WHERE login_id = '관리자아이디');
```

관리자는 로그인 후 랜딩 위쪽 메뉴의 "관리자" 또는 `/admin/applications`로 들어갑니다. 관리자가 아닌 계정은 "관리자만 볼 수 있어요"가
보이고, API도 403을 돌려줍니다.

남은 임시·미구현: **결제**(받아서 저장만, PG 연동 없음, 요금 "금액 미정"), **약관·환불 규정 전문**("준비 중"), **이메일·전화번호 인증**.
