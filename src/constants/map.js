// Map-builder constants. Pin `type` values are the codes the backend stores.

export const PIN_TYPE = {
  BOOTH: 'BOOTH',
  TOILET: 'TOILET',
  INFO: 'INFO',
  MEDICAL: 'MEDICAL',
  ETC: 'OTHER_FACILITY',
}

// Order = order shown in the "핀 생성하기" list. `icon` is a UI-only key.
export const FACILITIES = [
  { key: PIN_TYPE.BOOTH, label: '부스', icon: 'store' },
  { key: PIN_TYPE.TOILET, label: '화장실', icon: 'user' },
  { key: PIN_TYPE.INFO, label: '안내소', icon: 'info' },
  { key: PIN_TYPE.MEDICAL, label: '의무실', icon: 'plus-cross' },
  { key: PIN_TYPE.ETC, label: '기타 시설', icon: 'grid' },
]

// The map image must be PNG or JPEG, at most 10 MiB (the backend checks the real file content).
export const MAP_IMAGE_TYPES = ['image/png', 'image/jpeg']
export const MAP_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const MAP_PIN_MAX = 500
