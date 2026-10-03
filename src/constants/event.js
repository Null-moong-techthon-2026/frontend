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

// Event cover image (shown on the dashboard). Checked by extension.
export const EVENT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
export const EVENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB
