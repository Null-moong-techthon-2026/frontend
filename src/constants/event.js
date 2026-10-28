// Event progress is NOT stored: it is derived from the event dates (see utils/event.js).
export const EVENT_PROGRESS = {
  UPCOMING: 'upcoming', // 진행 예정 (before startDate)
  ONGOING: 'ongoing', // 진행 중 (startDate..endDate, inclusive)
  ENDED: 'ended', // 진행 종료 (after endDate)
}

export const EVENT_PROGRESS_LABEL = {
  [EVENT_PROGRESS.UPCOMING]: '진행 예정',
  [EVENT_PROGRESS.ONGOING]: '진행 중',
  [EVENT_PROGRESS.ENDED]: '진행 종료',
}

// Event publication: only a PUBLISHED event is visible to visitors and in the public event list.
export const EVENT_PUBLICATION = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
}

// Event cover image (shown on the dashboard). The backend accepts PNG / JPEG only.
export const EVENT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg']
export const EVENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB
export const EVENT_NAME_MAX = 100
export const EVENT_VENUE_MAX = 200
export const EVENT_INTRO_MAX = 10000
