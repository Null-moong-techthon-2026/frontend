// Data models the screens work with. JSDoc only — no runtime code.
// The backend's own shapes are documented in src/api/*.js; the converters (utils/event.js toEvent,
// utils/recruit.js toRecruit, utils/notice.js toNotice, context/MapProvider.jsx) turn them into the
// models below. Field notes: BACKEND_INTEGRATION.md
//
// Code values are the backend's own (constants/booth.js, constants/map.js, constants/notice.js).

/**
 * @typedef {'PENDING' | 'APPROVED' | 'REJECTED'} ReviewStatus   see BOOTH_STATUS
 * @typedef {'FOOD' | 'BEVERAGE' | 'EXPERIENCE' | 'GAME' | 'GOODS' | 'OTHER'} BoothCategory   see BOOTH_CATEGORY
 * @typedef {'PREPARING' | 'OPEN' | 'SOLD_OUT' | 'CLOSED'} OperationStatus   see BOOTH_OPERATING_STATUS
 * @typedef {'UNLIMITED' | 'AVAILABLE' | 'LOW' | 'SOLD_OUT'} StockLevel   see STOCK_LEVEL
 * @typedef {'NOT_TRACKED' | StockLevel} StockSummary   a booth's whole stock in one word; see STOCK_SUMMARY
 * @typedef {'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'NEEDS_CORRECTION'} DocumentCheckStatus   see DOCUMENT_CHECK
 *
 * @typedef {Object} Event                    the festival being managed (sidebar + dashboard + every screen)
 *   Progress (진행 예정/진행 중/진행 종료) is not a field: derive it from the dates (utils/event.js).
 * @property {string} id                      UUID; every event API call carries it
 * @property {string} name
 * @property {string} organizationName
 * @property {string} startDate               local 'YYYY-MM-DD'
 * @property {string} endDate                 local 'YYYY-MM-DD' (the whole day counts)
 * @property {string} venue
 * @property {string} intro                   line breaks are kept
 * @property {string | null} imageUrl         cover image shown on the dashboard (placeholder when null)
 * @property {string | null} imageAssetId     uploaded image the event links to
 * @property {'DRAFT' | 'PUBLISHED' | 'ARCHIVED'} publicationStatus   only PUBLISHED events are visible to visitors
 * @property {number} revision                sent back with every update
 * @property {string} visitorUrl              visitor link (placeholder: there is no visitor screen yet)
 *
 * @typedef {Object} Recruitment              the booth-recruitment announcement (부스 모집)
 *   Status (모집 중/모집 마감/비공개) is not a field: it is derived from `published` and `deadline`
 *   (utils/recruit.js getRecruitStatus).
 * @property {boolean} published              visible to booth operators
 * @property {string} intro                   line breaks are kept (max 300 in the form)
 * @property {BoothCategory[]} categories     booth categories allowed to apply (at least one)
 * @property {number | null} feeKrw           participation fee in won; null = not set, 0 = free
 * @property {string} feeNote                 fee remarks
 * @property {{ id: string, label: string, required: boolean, categories: string[] }[]} documents
 *   documents applicants submit; `id` is a server UUID, or 'new-N' before the first save
 * @property {string} deadline                local 'YYYY-MM-DDTHH:mm', '' when not set
 * @property {number | null} target           how many booths the organizer wants (a goal, not a limit)
 * @property {number} revision
 *
 * @typedef {Object} ApplicationRow           one row of the 부스 관리 list (backend shape)
 * @property {string} applicationId
 * @property {string} boothName
 * @property {string} submittedAt             ISO instant
 * @property {BoothCategory} categoryCode
 * @property {string} applicantName
 * @property {ReviewStatus} reviewStatus
 * @property {string | null} eventBoothId     set once approved
 * @property {string | null} boothCode        'B001'… set once approved
 *
 * @typedef {Object} OperatingBooth           one row of the 실시간 운영 현황 list (backend shape)
 * @property {string} eventBoothId
 * @property {string} boothCode
 * @property {string} name
 * @property {BoothCategory} categoryCode
 * @property {OperationStatus} operationStatus
 * @property {StockSummary} stockSummary
 * @property {'ASSIGNED' | 'UNASSIGNED'} placementStatus   on the published map or not
 * @property {'HIDDEN' | 'PUBLIC' | 'ARCHIVED'} visibilityStatus
 * @property {number} revision
 *
 * @typedef {'BOOTH' | 'TOILET' | 'INFO' | 'MEDICAL' | 'OTHER_FACILITY'} PinType   see PIN_TYPE
 *
 * @typedef {Object} Pin                      one pin on the floor plan (MapProvider)
 * @property {string} id                      UUID made by the client
 * @property {PinType} type
 * @property {string} label                   booth code for booth pins, the facility name otherwise
 * @property {string | null} boothId          event booth this pin is assigned to (booth pins only)
 * @property {number} x                       pixels in the ORIGINAL image (0..image.width)
 * @property {number} y                       pixels in the ORIGINAL image (0..image.height)
 *
 * @typedef {Object} Floorplan                the draft map's image (MapProvider `image`)
 * @property {string} url
 * @property {string} name
 * @property {number} width                   pixel width of the image file
 * @property {number} height                  pixel height of the image file
 *
 * @typedef {'published' | 'closed' | 'draft'} NoticeStatus   see NOTICE_STATUS
 * @typedef {'STAFF' | 'OPERATORS' | 'PUBLIC'} NoticeAudience   see NOTICE_AUDIENCE
 *
 * @typedef {Object} Notice                   one announcement
 * @property {string} id
 * @property {string} title
 * @property {string} body                    plain text; line breaks are kept ('' in list rows)
 * @property {{ assetId: string, url: string } | null} image   optional single image (not in list rows)
 * @property {NoticeAudience[]} audiences     who can see it (at least one when published)
 * @property {boolean} urgent                 urgent notices sit at the top of the audience's list
 * @property {NoticeStatus} status            'closed' = published once, now back to a draft
 * @property {string | null} publishedAt      local 'YYYY-MM-DDTHH:mm'; first time it went live
 * @property {string} updatedAt               local 'YYYY-MM-DDTHH:mm'
 * @property {number} revision
 */

export {}
