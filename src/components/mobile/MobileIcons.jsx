// Line icons for the mobile screens (24x24, drawn with currentColor).
const PATHS = {
  home: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  doc: 'M7 3h7l4 4v14H7zM14 3v5h4M10 13h5M10 17h5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0',
  store: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  bell: 'M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20h4',
  calendar: 'M5 6h14v14H5zM5 10h14M9 4v4M15 4v4',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.5',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  chevronDown: 'M6 9l6 6 6-6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  phone: 'M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4 4',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  check: 'M5 12l5 5 9-10',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  file: 'M7 3h7l4 4v14H7zM14 3v5h4',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h4.5a1.5 1.5 0 0 1 0 3H9zM9 13h5a1.5 1.5 0 0 1 0 3H9M11 8v10',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 14v6M14 20h3',
}

export default function MIcon({ name, size = 22, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
