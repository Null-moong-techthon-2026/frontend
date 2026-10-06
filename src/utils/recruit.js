import { RECRUIT_STATUS } from '../constants/recruit'
import { nowIso } from './date'

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
