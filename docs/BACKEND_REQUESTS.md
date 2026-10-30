# 백엔드 관련 정리 (2026-10-31 갱신)

요청했던 3가지(행사 개설, 계정 역할, 스태프 API)와 부스 사진 API가 배포 서버에 반영된 것을 확인하고 프론트를 연결했습니다.
아래는 **① 연결 현황 ② 확인이 필요한 것 ③ 아직 서버에 없는 것** 입니다.

---

## ① 프론트에 연결한 것 (Swagger 목록 기준)

| 기능 | 연결한 API | 프론트 파일 |
|---|---|---|
| 행사 개설 | `POST /api/event-openings` | `src/api/eventApi.js` `openEvent`, `src/pages/EventApplyPage.jsx` |
| 계정 역할 | 가입 `onboardingType`(`STAFF` 포함), `GET /api/me`의 `role` | `src/utils/role.js`, `src/components/SignupForm.jsx` |
| 스태프 초대 | `POST·GET·DELETE /events/{id}/staff-invitation` | `src/api/staffApi.js` |
| 스태프 명단·승인 | `GET /events/{id}/staff`, `PATCH …/staff/{memberId}`, `POST …/decision` | 〃 |
| 업무·근무표 | `GET·POST …/staff-duties`, `GET·POST …/staff-shifts`, `PUT …/staff-shifts/{id}/members` | 〃 |
| 스태프 본인 | `POST /staff-invitations/resolve`, `POST …/staff-applications`, `GET /me/staff-memberships`, `…/staff/me/schedule`, `…/clock-in`, `…/clock-out`, `…/attendance` | 〃 |
| 부스 사진 | `POST …/booths/{id}/media-assets`, `PUT …/booths/{id}/photos` | `src/api/operatorApi.js` |
| 스태프 공지 | 기존 `GET …/announcements?view=READ` | `src/api/staffApi.js` |

없앤 임시 코드: 행사 개설 신청 더미(브라우저 저장)와 승인 대기·관리자 화면, 가입 역할을 브라우저에 기억하던 코드, 스태프 데이터의 브라우저 저장, 신청서 안 서버에 안 보내던 입력칸(판매 품목·필요 설비·추가 질문·서류), 부스 운영 시간 입력.
남은 임시 데이터는 `?demo=1` 미리보기 모드의 샘플뿐이고, 일반 사용에서는 서버 데이터만 나옵니다.

## ② 확인이 필요한 것 (백엔드 담당자에게 부탁)

### 2-1. 응답 본문의 필드 이름 확인
새 API들의 응답이 Swagger에 타입으로 적혀 있지 않아(`object`로만 표시), 프론트가 아래 이름을 **가정**하고 읽습니다. 다르면 알려 주세요(수정 위치는 각 파일의 "normalizer" 부분 한 곳입니다).

| 응답 | 프론트가 읽는 필드(가정) |
|---|---|
| 스태프 멤버 | `memberId`(또는 `id`), `name`(또는 `nickname`), `role`, `status`, `dutyId`, `phone`(또는 `phoneNumber`), `email`, `affiliation`, `memo`, `revision` |
| 명단 목록 | `{content:[멤버…], summary:{total, admin, staff, labor, volunteer, pending}}` (summary가 없으면 프론트가 셉니다) |
| 업무 | `{id, zone, name}` |
| 근무 | `{id, date, dutyId, start, end, roles[], memberIds[](또는 members[]), revision}` — 시각은 `14:00` 또는 `14:00:00` |
| 내 일정 | 근무 목록. 각 항목에 `dutyName`, `zone`, `start`, `end`, 그리고 함께 근무하는 사람 `mates`(또는 `coworkers`/`members`) = `[{id, name, role, phone}]` |
| 출퇴근 | `{date, in/out}` 또는 `{clockInAt, clockOutAt}`(ISO 시각), `workedMinutes` |
| 내 참여 목록 | `{eventId, memberId, role, status, eventName, startsAt/endsAt, venue, dutyName, name, phone, email, affiliation}` |
| 초대 확인(resolve) | 행사 요약 `{eventId, name, startsAt, endsAt, venue, …}`. 행사 사진은 `GET /staff-invitations/{code}/poster` 주소를 그대로 이미지로 씁니다 |
| 초대 발급·조회 | `{code, inviteUrl, expiresAt}` |
| 행사 개설 응답 | 만들어진 행사(특히 `id`). 프론트는 응답을 쓰지 않고 `GET /api/me/events`를 다시 불러옵니다 |
| 부스 사진 | 부스 상세·공개 부스 응답의 `photos:[{mediaAssetId(또는 id), readUrl}]`, 업로드 응답의 `mediaAssetId` |

### 2-2. Swagger 스키마 이름 충돌
`Apply`, `Decision`, `Resolve`가 부스 쪽과 스태프 쪽에서 **같은 이름**을 써서, 문서에는 한쪽 필드만 보입니다(부스 신청 본문이 스태프 신청 모양으로 보임). 서로 다른 이름(`@Schema(name=…)`)을 붙여 주세요. 프론트는 부스 신청에 `{boothProfileId, applicantName, applicantPhone, applicantEmail, invitationCode?}`를 그대로 보냅니다.

### 2-3. 배포 설정 (코드 변경 아님)
- 운영자 초대 링크(`inviteUrl`)가 `http://127.0.0.1:5173/invite/…`로 만들어지지 않는지 확인: 배포 서버의 `FRONTEND_INVITE_BASE_URL`(= `boothrock.frontend.invite-base-url`)을 **실제 프론트 주소**(예: `https://프론트주소/invite`)로. 스태프 초대 링크(`/invite/staff/{토큰}`)도 같은 방식으로 프론트 주소여야 합니다.
- 프론트를 서비스 주소에 올릴 때는 `/api`를 이 백엔드로 넘기는 설정(프록시/리라이트)이 호스팅에 필요합니다. 서버가 다른 출처의 요청을 막기 때문입니다(CORS).

## ③ 아직 서버에 없는 것 (이번 범위 밖, 화면은 없거나 샘플)

| 기능 | 지금 프론트 상태 |
|---|---|
| 행사 운영 시간·오시는 길·문의처(운영본부 전화) | 값이 없으면 그 줄을 숨기고, "운영본부 연락"은 "연락처가 아직 등록되지 않았어요" 안내 |
| 부스 운영 시간·SNS 링크 | 입력·표시 없음 (샘플에서만 보임) |
| 후원사(스폰서)·홈 광고 | 일반 사용에서는 숨김, 샘플에서만 보임 |
| 통계(조회 수·광고 노출/클릭) | 화면에 "예시 데이터" 표시, 가짜 숫자 |
| 결제 내역, 계정 정보 수정·비밀번호 변경 | 운영자 프로필 "결제 내역"은 샘플에서만, 계정 정보는 읽기 전용 |
| 알림(종 아이콘) | 공지 화면으로 이동만 |
| 재고 "중간" 단계 | 서버 값(충분·부족·품절·무제한)만 사용 |

## 화면을 먼저 보고 싶다면
`npm run dev` 후 주소 끝에 `?demo=1`(참여한 계정) 또는 `?demo=2`(새 계정)을 붙이면 서버 없이 샘플 데이터로 모든 화면이 보입니다. (`?demo=0`으로 끄기)
방문객 `/e/demo-event`, 부스 운영자 `/operator/home`, 스태프 `/staff/home`, 주최자 `/organizer/staff`·`/organizer/stats`.
