# 백엔드 관련 정리 (2026-11-03 갱신, 서버로 직접 확인함)

요청했던 3가지(행사 개설, 계정 역할, 스태프 API)와 부스 사진 API가 배포 서버에 반영된 것을 확인하고 프론트를 연결했습니다.
아래는 **① 연결 현황 ② 서버로 확인한 결과와 남은 부탁 ③ 아직 서버에 없는 것** 입니다.

---

## ① 프론트에 연결한 것 (Swagger 목록 기준)

| 기능 | 연결한 API | 프론트 파일 |
|---|---|---|
| 행사 개설 신청 | `POST /api/event-openings` → `{id, status:'PENDING', createdAt, revision}` (승인 전에는 단체·행사가 안 만들어짐) | `src/api/eventApi.js` `openEvent`, `src/pages/EventApplyPage.jsx` |
| 내 개설 신청 상태 | `GET /api/me/event-openings` (`status` PENDING/APPROVED/REJECTED, `rejectionReason`, `eventId`) | `src/pages/EventPendingPage.jsx` |
| 개설 신청 심사(관리자) | `GET /api/admin/event-openings`, `GET …/{id}`, `POST …/{id}/decision {decision, rejectionReason?, revision}` | `src/pages/AdminApplicationsPage.jsx` (ADMIN 계정만, `/admin/applications`) |
| 신청 서류 | `POST /api/events/{e}/applications/{a}/documents?requirementId` (multipart `file`), `GET …/documents/{id}`, `…/content` | `src/api/operatorApi.js` `uploadApplicationDocument`, `src/pages/operator/OperatorApply.jsx`, `src/pages/BoothManagePage.jsx` |
| 계정 역할 | 가입 `onboardingType`(`STAFF` 포함), `GET /api/me`의 `role` | `src/utils/role.js`, `src/components/SignupForm.jsx` |
| 스태프 초대 | `POST·GET·DELETE /events/{id}/staff-invitation` | `src/api/staffApi.js` |
| 스태프 명단·승인 | `GET /events/{id}/staff`, `PATCH …/staff/{memberId}`, `POST …/decision` | 〃 |
| 업무·근무표 | `GET·POST …/staff-duties`, `GET·POST …/staff-shifts`, `PUT …/staff-shifts/{id}/members` | 〃 |
| 스태프 본인 | `POST /staff-invitations/resolve`, `POST …/staff-applications`, `GET /me/staff-memberships`, `…/staff/me/schedule`, `…/clock-in`, `…/clock-out`, `…/attendance` | 〃 |
| 부스 사진 | `POST …/booths/{id}/media-assets`, `PUT …/booths/{id}/photos` | `src/api/operatorApi.js` |
| 스태프 공지 | 기존 `GET …/announcements?view=READ` | `src/api/staffApi.js` |

없앤 임시 코드: 행사 개설 신청 더미(브라우저 저장), 가입 역할을 브라우저에 기억하던 코드, 스태프 데이터의 브라우저 저장, 신청서 안 서버에 안 보내던 입력칸(판매 품목·필요 설비·추가 질문·서류), 부스 운영 시간 입력.
남은 임시 데이터는 `?demo=1` 미리보기 모드의 샘플뿐이고, 일반 사용에서는 서버 데이터만 나옵니다. 샘플 보기 모드는 배포용 빌드에서는 꺼져 있어요.

## ② 서버로 직접 확인한 결과 (2026-10-31)

시험 계정(주최자·스태프·부스 운영자)과 시험 행사 1개를 서버에 만들어 가입 → 행사 개설 → 스태프 초대·신청·승인·근무표·출퇴근 → 부스 신청·승인·사진까지 한 바퀴를 실제로 돌려 봤고, 프론트(주최자·스태프·방문객·운영자 화면)도 그 데이터로 열어 확인했습니다. 응답 모양은 프론트가 가정한 것과 거의 같았고, 아래 차이만 프론트에서 맞췄습니다.

| 발견한 것 | 프론트에서 한 일 |
|---|---|
| 스태프·운영자 초대 링크가 `https://frontend.invalid/invite/…`로 만들어짐 (서버 설정 미지정) | 링크를 프론트가 토큰으로 직접 만들어 현재 사이트 주소로 보여 줍니다. 서버 설정을 고치면 더 깔끔하지만 필수는 아닙니다 |
| 내 일정(`staff/me/schedule`)의 `members`에 나 자신이 포함됨 | "함께 근무하는 스태프"에서 나를 뺍니다 |
| 내 참여 목록(`me/staff-memberships`)에 이름·기간·장소가 없음 | 행사 정보는 `GET /events/{id}`로 따로 읽습니다 |
| 부스 사진 응답은 `photos:[{mediaAssetId, sortOrder, imageUrl}]`, 공개 목록은 `coverImageUrl` | 그 이름대로 읽습니다 |
| 출퇴근 시각이 ISO 시각(UTC), 날짜는 서버 기준 | 브라우저 시간대로 바꿔 보여 줍니다 |

### 백엔드가 반영한 것 (2026-11-01 반영, 11-03 서버로 직접 확인)
- 행사 개설 승인: 신청은 `PENDING`으로 저장, 관리자(ADMIN)가 승인·반려. 승인하면 단체·행사가 만들어지고 반려하면 `rejectionReason`이 신청자에게 보인다.
- 부스 신청 서류 업로드·열람(`documents`, `documentId`/`fileName` 응답 확인됨), 서류 확인 상태.
- 승인 취소: `POST …/applications/{id}/cancellation {revision, cancelReason?}` → `reviewStatus: CANCELLED`, 기록은 남고 부스는 부스 목록에서 사라진다.
- 신청서 부가 항목(`affiliation`, `bankName`, `accountNumber`, `accountHolder`, `saleItems`, `requiredFacilities`)과 추가 질문(`additionalQuestions` / `additionalAnswers`), 모집 공고 `contactPhone`.
- 공지 파일 첨부(`POST …/announcement-attachments`, 공지 `attachmentIds`, 읽기 응답의 `attachments[]`).
- 스태프 본인 참여 목록(`/api/me/staff-memberships`)의 `affiliation`.
- 스키마 이름 분리, `localhost:5173` CORS 허용.
- ADMIN 계정: 일반 계정으로 가입한 뒤 백엔드가 ADMIN으로 변경(시험용 `demo_admin` 확인됨). 관리자 목록·상세 응답에 `applicant{nickname,email,phoneNumber}`가 있다.

### 초대 코드가 모집 마감보다 오래가면 신청이 404 (2026-11-03 서버로 재현)
- 초대 코드의 만료는 모집 마감보다 늦을 수 없다(발급할 때 400 `Invitation must expire in the future and no later than recruitment closes`).
- 그런데 코드를 발급한 **뒤에** 모집 마감을 앞당기면, 그 코드는 `resolve`(코드 확인)는 성공하고 `GET …/application-invitation`도 `active: true`인데 **신청에서만 404**가 된다. 마감을 원래대로 돌리면 다시 된다. (재현: 마감 1분 앞당김 → 404, 되돌림 → 정상, 뒤로 미룸 → 정상)
- 부탁: 마감을 바꿀 때 초대 만료도 같이 맞추거나(마감으로 줄이기), 404 대신 이유가 보이는 오류를 주고, `active`에도 반영해 주세요. 프론트는 이 상태를 감지해 대시보드에 "초대 코드를 다시 발급하세요" 경고를 띄우고, 신청 화면에는 안내 문구를 보여 준다.

### 스태프·근무·출퇴근 (2026-11-07 서버로 직접 확인)
1. **같은 날 두 번째 출근이 막혀요.** 출근 → 퇴근 뒤에 다시 `clock-in`을 보내면 `409 ALREADY_CLOCKED_IN`("Already clocked in today"), `canClockIn: false`. 스태프가 "퇴근하면 출근을 다시 못해요"라고 느끼는 원인이에요. 점심 휴식 후 복귀처럼 하루에 여러 번 출퇴근해야 한다면 하루 여러 구간을 허용해 주세요. (프론트는 응답의 `canClockIn`/`canClockOut`을 그대로 따라서, 서버가 허용하면 바로 다시 출근할 수 있어요. 지금은 "오늘은 이미 퇴근했어요" 안내를 보여 줘요.) 하루 한 번이 정책이라면 그대로 두셔도 돼요.
2. **주최자가 스태프별 출퇴근 기록을 볼 방법이 없어요.** 주최자 쪽은 `GET …/staff-live`(근무 중·휴식·미출근 수와 사람 목록)와 명단의 `status`뿐이고, 사람별·날짜별 출근/퇴근 시각 목록은 `GET …/staff/me/attendance`(본인 것)만 있어요. "근무표와 출퇴근 기록을 나란히 비교"하려면 **주최자용 출퇴근 기록 목록**이 필요해요. 예: `GET /api/events/{eventId}/staff-attendance?date=` → `[{memberId, name, date, in, out, workedMinutes}]`.
3. 주최자가 상태를 "근무 중"·"휴식"으로 바꾸면 `409 ATTENDANCE_CONFLICT`("Clock in before changing to WORKING or BREAK")예요. 서버 규칙으로 이해하고 프론트를 맞췄어요(대기·미출근만 직접 바꾸고, 업무 배정은 상태를 건드리지 않음). 문서(Swagger)에 이 규칙을 적어 주세요.
4. 스태프 초대 코드: **대소문자를 구분**해요(`BL-…`를 소문자로 보내면 404). 만료는 `min(행사 종료일 끝, 발급일 + 14일)`로 보여요(샤랑제: 11-07 23:59 KST까지). 프론트는 입력을 정리해서 보내요(공백 제거, `BL-`는 대문자, 링크를 통째로 붙여 넣어도 코드만 추출).
5. 근무표 수정·삭제(`PUT/DELETE staff-shifts/{id}`)는 잘 돼요. 프론트에 "시간·역할 변경", "근무 삭제"를 붙였어요. 행사 날짜 밖의 날짜는 400(`Shift date must be within the event dates`)이에요.

### 모집 마감일이 행사 종료일보다 늦게 저장돼요 (2026-11-07 확인)
- 서버가 `closesAt`이 행사 `endsAt` 뒤여도 저장해요(샤랑제: 행사 11-05~11-07, 모집 마감 11-17 → 행사가 끝난 뒤에도 "모집 중 D-10"). 운영자 화면에 이미 끝난 행사가 모집 중으로 보였어요.
- 부탁: 저장할 때 `closesAt ≤ 행사 종료`를 검증하고, 공개 목록(`/api/public/events?recruitmentStatus=OPEN`)에서 종료된 행사는 빼 주세요. (프론트는 입력에서 막고, 종료된 행사는 목록에서 숨겨요.)

### 배포 후에 확인할 것 (후순위)
1. ~~배포 주소를 CORS에 추가~~ → **완료**(2026-11-04 배포 주소에서 확인).
2. ~~초대 링크 주소 설정~~ → **완료**(2026-11-07 `inviteUrl`이 배포 주소로 나와요).
3. 시험 계정과 행사 데이터는 시연에 쓰려고 그대로 둬요(`demo_*`, `cc_probe_*`).

## ③ 아직 서버에 없는 것 (이번 범위 밖, 화면은 없거나 샘플)

| 기능 | 지금 프론트 상태 |
|---|---|
| 행사 운영 시간·오시는 길·문의처(운영본부 전화) | 값이 없으면 그 줄을 숨기고, "운영본부 연락"은 "연락처가 아직 등록되지 않았어요" 안내 |
| 부스 운영 시간·SNS 링크 | 입력·표시 없음 |
| 후원사(스폰서)·홈 광고 | 일반 사용에서는 숨김, 샘플에서만 보임 |
| 통계(조회 수·광고 노출/클릭) | "준비 중" 배지와 숫자 없는 빈 화면 (가짜 숫자는 지웠음) |
| 결제 내역, 계정 정보 수정·비밀번호 변경 | 운영자 프로필 "결제 내역"은 샘플에서만, 계정 정보는 읽기 전용 |
| 알림(종 아이콘) | 공지 화면으로 이동만 |
| 재고 "중간" 단계 | 서버 값(충분·부족·품절·무제한)만 사용 |

## 화면을 먼저 보고 싶다면
`npm run dev` 후 주소 끝에 `?demo=1`(참여한 계정) 또는 `?demo=2`(새 계정)을 붙이면 서버 없이 샘플 데이터로 모든 화면이 보입니다. (`?demo=0`으로 끄기) (개발 서버에서만 동작, 배포 사이트에서는 꺼져 있어요)
방문객 `/e/demo-event`, 부스 운영자 `/operator/home`, 스태프 `/staff/home`, 주최자 `/organizer/staff`·`/organizer/stats`.
