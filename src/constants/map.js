// Map-builder constants. Pin `type` values are the codes the backend stores.

export const PIN_TYPE = {
  BOOTH: 'booth',
  TOILET: 'toilet',
  INFO: 'info',
  MEDICAL: 'medical',
  ETC: 'etc',
}

// Order = order shown in the "핀 생성하기" list. `icon` is a UI-only key.
export const FACILITIES = [
  { key: PIN_TYPE.BOOTH, label: '부스', icon: 'store' },
  { key: PIN_TYPE.TOILET, label: '화장실', icon: 'user' },
  { key: PIN_TYPE.INFO, label: '안내소', icon: 'info' },
  { key: PIN_TYPE.MEDICAL, label: '의무실', icon: 'plus-cross' },
  { key: PIN_TYPE.ETC, label: '기타 시설', icon: 'grid' },
]
