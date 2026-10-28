import { BOOTH_CATEGORY_LABEL } from '../constants/booth'
import { RECRUIT_STATUS } from '../constants/recruit'
import { instantToLocalDateTime, localDateTimeToInstant, nowIso } from './date'

const CATEGORY_ORDER = Object.keys(BOOTH_CATEGORY_LABEL)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Recruit status from the announcement's visibility and the deadline:
//   not published              -> private (비공개)
//   published, before deadline -> open (모집 중)
//   published, after deadline  -> closed (모집 마감)
// `deadline` and `now` are 'YYYY-MM-DDTHH:mm' strings, which compare correctly as text.
// An empty deadline counts as "no deadline". `now` is injectable for tests.
export function getRecruitStatus(published, deadline, now = nowIso()) {
  if (!published) return RECRUIT_STATUS.PRIVATE
  return deadline && now > deadline ? RECRUIT_STATUS.CLOSED : RECRUIT_STATUS.OPEN
}

// Backend recruitment -> the Recruitment model the screens use (see src/types.js).
export function toRecruit(raw) {
  return {
    published: raw.publicationStatus === 'PUBLISHED',
    intro: raw.introduction ?? '',
    categories: CATEGORY_ORDER.filter((c) => raw.allowedCategoryCodes.includes(c)),
    feeKrw: raw.participationFeeKrw ?? null,
    feeNote: raw.feeNote ?? '',
    documents: raw.documentRequirements.map((d) => ({
      id: d.id,
      label: d.name,
      required: d.isRequired,
      categories: d.applicableCategoryCodes,
    })),
    deadline: instantToLocalDateTime(raw.closesAt), // 'YYYY-MM-DDTHH:mm' or ''
    target: raw.targetBoothCount ?? null,
    revision: raw.revision,
  }
}

// Recruitment model -> the PUT body. Documents without a server id (new ones) are sent without
// `id`; the backend creates it.
export function toRecruitRequest(recruit, revision) {
  return {
    revision,
    introduction: recruit.intro,
    publicationStatus: recruit.published ? 'PUBLISHED' : 'DRAFT',
    closesAt: localDateTimeToInstant(recruit.deadline),
    targetBoothCount: recruit.target,
    allowedCategoryCodes: recruit.categories,
    participationFeeKrw: recruit.feeKrw,
    feeNote: recruit.feeNote,
    documentRequirements: recruit.documents.map((d, i) => ({
      ...(UUID.test(d.id) ? { id: d.id } : {}),
      name: d.label,
      isRequired: d.required,
      applicableCategoryCodes: d.categories ?? [],
      sortOrder: i,
    })),
  }
}
