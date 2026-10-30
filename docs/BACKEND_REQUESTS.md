# 백엔드 관련 정리 (2026-10-31 갱신, 서버로 직접 확인함)

요청했던 3가지(행사 개설, 계정 역할, 스태프 API)와 부스 사진 API가 배포 서버에 반영된 것을 확인하고 프론트를 연결했습니다.
아래는 **① 연결 현황 ② 서버로 확인한 결과와 남은 부탁 ③ 아직 서버에 없는 것** 입니다.

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

## ② 서버로 직접 확인한 결과 (2026-10-31)

시험 계정(주최자·스태프·부스 운영자)과 시험 행사 1개를 서버에 만들어 가입 → 행사 개설 → 스태프 초대·신청·승인·근무표·출퇴근 → 부스 신청·승인·사진까지 한 바퀴를 실제로 돌려 봤고, 프론트(주최자·스태프·방문객·운영자 화면)도 그 데이터로 열어 확인했습니다. 응답 모양은 프론트가 가정한 것과 거의 같았고, 아래 차이만 프론트에서 맞췄습니다.

| 발견한 것 | 프론트에서 한 일 |
|---|---|
| 스태프·운영자 초대 링크가 `https://frontend.invalid/invite/…`로 만들어짐 (서버 설정 미지정) | 링크를 프론트가 토큰으로 직접 만들어 현재 사이트 주소로 보여 줍니다. 서버 설정을 고치면 더 깔끔하지만 필수는 아닙니다 |
| 내 일정(`staff/me/schedule`)의 `members`에 나 자신이 포함됨 | "함께 근무하는 스태프"에서 나를 뺍니다 |
| 내 참여 목록(`me/staff-memberships`)에 이름·기간·장소가 없음 | 행사 정보는 `GET /events/{id}`로 따로 읽습니다 |
| 부스 사진 응답은 `photos:[{mediaAssetId, sortOrder, imageUrl}]`, 공개 목록은 `coverImageUrl` | 그 이름대로 읽습니다 |
| 출퇴근 시각이 ISO 시각(UTC), 날짜는 서버 기준 | 브라우저 시간대로 바꿔 보여 줍니다 |

### 백엔드에 남은 부탁
1. **Swagger 스키마 이름 충돌**: `Apply`, `Decision`, `Resolve`가 부스 쪽과 스태프 쪽에서 같은 이름이라 문서에 한쪽 필드만 보입니다. 서로 다른 이름(`@Schema(name=…)`)을 붙여 주세요.
2. **초대 링크 주소 설정**: `FRONTEND_INVITE_BASE_URL`(= `boothrock.frontend.invite-base-url`)을 실제 프론트 주소로. (프론트가 우회하고 있어서 급하지 않음)
3. **프론트 호스팅 설정**: 서비스 주소에서는 `/api`를 이 백엔드로 넘기는 프록시/리라이트가 필요합니다(서버가 다른 출처 요청을 막음).
4. **시험 데이터 정리**: 서버에 시험 데이터가 남아 있습니다. DB를 비워 주세요. (가입 아이디 `cc_probe_org1`, `cc_probe_stf1`, `cc_probe_op1`, 행사 "프로브 축제")

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
