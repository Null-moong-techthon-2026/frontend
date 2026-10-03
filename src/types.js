// Data models shared between the UI and (future) backend. JSDoc only — no runtime code.
// Full field notes: BACKEND_INTEGRATION.md

/**
 * @typedef {'pending' | 'approved' | 'rejected'} BoothStatus   see BOOTH_STATUS
 * @typedef {'food' | 'drink' | 'experience' | 'goods'} BoothCategory   see BOOTH_CATEGORY
 *
 * @typedef {Object} Booth                    one booth application
 * @property {number} id                      unique booth id (pins reference it as boothId)
 * @property {string} name
 * @property {BoothCategory} category
 * @property {BoothStatus} status
 * @property {string} appliedAt               ISO date, YYYY-MM-DD
 * @property {number | null} boothNo          booth number, only while approved
 * @property {'preparing' | 'open' | 'soldout' | 'closed' | null} operatingStatus  day-of status; only approved booths have one (see BOOTH_OPERATING_STATUS)
 * @property {string} intro                   운영 소개
 * @property {{ name: string, phone: string, email: string }} applicant
 * @property {{ id: string, name: string, url: string | null }[]} documents
 * @property {string} reviewMemo              organizer-only
 * @property {string} rejectReason            visible to organizer and booth operator
 *
 * @typedef {'booth' | 'toilet' | 'info' | 'medical' | 'etc'} PinType   see PIN_TYPE
 *
 * @typedef {Object} Pin                      one pin on the floor plan
 * @property {number} id
 * @property {PinType} type
 * @property {string} name                    booth name once assigned, otherwise ''
 * @property {number | null} boothId          Booth.id this pin is assigned to
 * @property {number} x                       pixels in the ORIGINAL image (0..floorplan.width)
 * @property {number} y                       pixels in the ORIGINAL image (0..floorplan.height)
 *
 * @typedef {'published' | 'closed' | 'draft'} NoticeStatus   see NOTICE_STATUS
 * @typedef {'staff' | 'booth' | 'visitor'} NoticeAudience   see NOTICE_AUDIENCE
 *
 * @typedef {Object} Notice                   one announcement
 * @property {number} id
 * @property {string} title
 * @property {string} body                    plain text; line breaks are kept
 * @property {{ id: string, name: string, size: number, url: string }[]} attachments  optional files (images shown inline)
 * @property {NoticeAudience[]} audiences     who can see it (at least one when published)
 * @property {boolean} urgent                 urgent notices sit at the top of the audience's list
 * @property {NoticeStatus} status
 * @property {string | null} publishedAt      'YYYY-MM-DDTHH:mm'; first time it went live
 * @property {string} updatedAt               'YYYY-MM-DDTHH:mm'
 *
 * @typedef {Object} Event                   the festival being managed (sidebar + dashboard).
 *   Progress (진행 예정/진행 중/진행 종료) is not a field: derive it from the dates (utils/event.js).
 * @property {string} name
 * @property {string} startDate               YYYY-MM-DD
 * @property {string} endDate                 YYYY-MM-DD
 * @property {string} venue
 * @property {string | null} imageUrl         cover image shown on the dashboard (placeholder when null)
 * @property {string} intro                   line breaks are kept
 * @property {string} recruitDeadline         'YYYY-MM-DDTHH:mm'
 * @property {number} recruitTarget           teams the organizer wants to recruit
 * @property {string} inviteCode              booth-operator invite code
 * @property {string} inviteUrl               booth-operator invite link
 * @property {string} visitorUrl              visitor link (also encoded in the QR)
 *
 * @typedef {Object} Floorplan                uploaded floor-plan image
 * @property {string} url
 * @property {string} name
 * @property {number} width                   natural pixel width
 * @property {number} height                  natural pixel height
 */

export {}
