import {
  NOTICE_AUDIENCE_LABEL,
  NOTICE_STATUS,
} from '../constants/notice'
import { formatDateTime, instantToLocalDateTime } from './date'

const AUDIENCES = Object.keys(NOTICE_AUDIENCE_LABEL)

// Backend announcement -> the Notice model the screens use (see src/types.js).
// List rows carry no body / image; those fields are filled in once the notice is opened.
export function toNotice(raw) {
  const published = raw.publicationStatus === 'PUBLISHED'
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body ?? '',
    image: raw.imageAssetId ? { assetId: raw.imageAssetId, url: raw.imageUrl } : null,
    audiences: AUDIENCES.filter((a) => raw.audiences.includes(a)),
    urgent: raw.isUrgent,
    // The backend has no "closed": a notice that was published once and is back to DRAFT is one.
    status: published
      ? NOTICE_STATUS.PUBLISHED
      : raw.publishedAt
        ? NOTICE_STATUS.CLOSED
        : NOTICE_STATUS.DRAFT,
    publishedAt: instantToLocalDateTime(raw.publishedAt) || null,
    updatedAt: instantToLocalDateTime(raw.updatedAt),
    revision: raw.revision,
  }
}

// "전체 대상" when everyone is selected, otherwise the labels in display order.
export const audienceText = (audiences) =>
  audiences.length === AUDIENCES.length
    ? '전체 대상'
    : AUDIENCES.filter((a) => audiences.includes(a))
        .map((a) => NOTICE_AUDIENCE_LABEL[a])
        .join(' · ')

// 'YYYY.MM.DD HH:mm' (drafts: '저장 YYYY.MM.DD HH:mm').
export const noticeDateText = (n) =>
  n.status === NOTICE_STATUS.DRAFT
    ? `저장 ${formatDateTime(n.updatedAt)}`
    : formatDateTime(n.publishedAt)

const sortKey = (n) => n.publishedAt ?? n.updatedAt
// Urgent notices that are live float to the top of the list.
const isPinned = (n) => n.urgent && n.status === NOTICE_STATUS.PUBLISHED

// Display order shared by the notice list and the dashboard's recent notices.
export const sortNotices = (list) =>
  [...list].sort(
    (a, b) => Number(isPinned(b)) - Number(isPinned(a)) || sortKey(b).localeCompare(sortKey(a)),
  )
