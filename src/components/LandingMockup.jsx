import { useEffect, useRef, useState } from 'react'
import { Icon } from './OrganizerLayout'

// Miniature of the organizer app for the landing page. It is drawn with fixed sample data (not
// real data) and cycles through five screens: the screen in front is sharp, the others are faded
// out, and the sidebar highlights the matching menu item.

const BASE_W = 700
const BASE_H = 440
const SLIDE_MS = 3000

const SLIDES = [
  {
    key: 'dashboard',
    nav: '대시보드',
    icon: 'grid',
    title: '비룡제 2026',
    sub: '인하대학교 · 2026.09.22 — 09.24',
    caption: ['행사 현황을 한눈에', '신청·승인·운영 숫자를 실시간으로 확인해요.'],
  },
  {
    key: 'map',
    nav: '지도 제작',
    icon: 'map',
    title: '지도 제작',
    sub: '평면도에 핀을 놓고 부스를 배치해요',
    caption: ['승인된 부스, 지도에 바로 배치', '주최자와 운영자가 함께 관리해요.'],
  },
  {
    key: 'booths',
    nav: '부스 관리',
    icon: 'store',
    title: '부스 관리',
    sub: '신청 정보를 확인하고 승인 여부를 정해요',
    caption: ['신청 검토부터 승인까지', '서류 상태를 확인하고 결과를 남겨요.'],
  },
  {
    key: 'live',
    nav: '운영 현황',
    icon: 'chart',
    title: '실시간 운영 현황',
    sub: '부스의 운영 상태와 재고를 확인해요',
    caption: ['현장 운영 상태를 실시간으로', '품절·마감도 놓치지 않고 확인해요.'],
  },
  {
    key: 'notices',
    nav: '공지사항',
    icon: 'bell',
    title: '공지사항',
    sub: '대상별 공지를 작성하고 전달해요',
    caption: ['대상별로 공지를 전달', '긴급 공지는 목록 맨 위에 보여요.'],
  },
]

const BOOTHS = [
  ['달빛 떡볶이', '운영 중', 'on'],
  ['오늘의 커피', '운영 중', 'on'],
  ['캠퍼스 포토', '준비 중', 'prep'],
  ['행운상점', '운영 중', 'on'],
]

function Pins({ rows }) {
  return rows.map((row, r) => (
    <div className="lm-pinrow" key={r}>
      {row.map((n) => (
        <span className="lm-pin" key={n}>
          {n}
        </span>
      ))}
    </div>
  ))
}

function DashboardSlide() {
  return (
    <>
      <div className="lm-stats">
        <div className="lm-stat">
          <span>신청 부스</span>
          <strong>18</strong>
        </div>
        <div className="lm-stat is-green">
          <span>승인 완료</span>
          <strong>12</strong>
        </div>
        <div className="lm-stat is-lime">
          <span>검토 중</span>
          <strong>5</strong>
        </div>
      </div>
      <div className="lm-cols">
        <div className="lm-card">
          <b>행사장 지도</b>
          <div className="lm-plan">
            <i className="lm-stage">무대</i>
            <div className="lm-block">
              <Pins rows={[[1, 2, 3, 4]]} />
            </div>
            <div className="lm-block">
              <Pins rows={[[5, 6, 7, 8]]} />
            </div>
          </div>
        </div>
        <div className="lm-card">
          <b>
            부스 운영 현황 <em>실시간</em>
          </b>
          {BOOTHS.map(([name, state, tone]) => (
            <div className="lm-row" key={name}>
              <span>{name}</span>
              <i className={`lm-chip is-${tone}`}>{state}</i>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MapSlide() {
  return (
    <div className="lm-cols is-map">
      <div className="lm-card lm-canvas">
        <b>행사장 평면도</b>
        <div className="lm-plan is-tall">
          <i className="lm-stage">무대</i>
          <div className="lm-block">
            <Pins rows={[[1, 2, 3, 4]]} />
          </div>
          <div className="lm-block">
            <Pins rows={[[5, 6, 7]]} />
            <span className="lm-pin is-empty" />
          </div>
          <span className="lm-facility is-wc">WC</span>
          <span className="lm-facility is-info">i</span>
        </div>
      </div>
      <div className="lm-card">
        <b>승인된 부스 할당</b>
        <div className="lm-mini-stats">
          <span>
            총원<strong>12</strong>
          </span>
          <span>
            배치<strong>7</strong>
          </span>
          <span className="is-lime">
            미배치<strong>5</strong>
          </span>
        </div>
        {BOOTHS.map(([name], i) => (
          <div className="lm-row" key={name}>
            <span>
              <u>{i + 1}</u> {name}
            </span>
            <i className={`lm-chip ${i < 3 ? 'is-on' : 'is-prep'}`}>{i < 3 ? '배치 완료' : '미배치'}</i>
          </div>
        ))}
      </div>
    </div>
  )
}

function BoothsSlide() {
  const rows = [
    ['달빛 떡볶이', '음식', '검토 중', 'wait'],
    ['오늘의 커피', '음료', '승인', 'on'],
    ['캠퍼스 포토', '체험', '승인', 'on'],
    ['행운상점', '굿즈', '반려', 'no'],
    ['작은 공방', '체험', '검토 중', 'wait'],
  ]
  return (
    <>
      <div className="lm-stats">
        <div className="lm-stat">
          <span>전체 신청</span>
          <strong>18</strong>
        </div>
        <div className="lm-stat is-green">
          <span>승인</span>
          <strong>12</strong>
        </div>
        <div className="lm-stat is-lime">
          <span>검토 중</span>
          <strong>5</strong>
        </div>
      </div>
      <div className="lm-card lm-table">
        <div className="lm-trow is-head">
          <span>부스명</span>
          <span>카테고리</span>
          <span>상태</span>
          <span>부스 번호</span>
        </div>
        {rows.map(([name, cat, state, tone], i) => (
          <div className="lm-trow" key={name}>
            <span>{name}</span>
            <span>{cat}</span>
            <span>
              <i className={`lm-chip is-${tone}`}>{state}</i>
            </span>
            <span>{tone === 'on' ? `B00${i}` : '—'}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function LiveSlide() {
  const rows = [
    ['B001', '달빛 떡볶이', '운영 중', 'on', '충분'],
    ['B002', '오늘의 커피', '운영 중', 'on', '부족'],
    ['B003', '캠퍼스 포토', '준비 중', 'prep', '무제한'],
    ['B004', '행운상점', '품절', 'no', '품절'],
  ]
  return (
    <>
      <div className="lm-stats is-four">
        <div className="lm-stat is-green">
          <span>운영 중</span>
          <strong>8</strong>
        </div>
        <div className="lm-stat is-lime">
          <span>준비 중</span>
          <strong>3</strong>
        </div>
        <div className="lm-stat">
          <span>품절</span>
          <strong>1</strong>
        </div>
        <div className="lm-stat">
          <span>마감</span>
          <strong>0</strong>
        </div>
      </div>
      <div className="lm-card lm-table">
        <div className="lm-trow is-head is-live">
          <span>번호</span>
          <span>부스명</span>
          <span>운영 상태</span>
          <span>재고</span>
        </div>
        {rows.map(([code, name, state, tone, stock]) => (
          <div className="lm-trow is-live" key={code}>
            <span>{code}</span>
            <span>{name}</span>
            <span>
              <i className={`lm-chip is-${tone}`}>{state}</i>
            </span>
            <span className={stock === '부족' || stock === '품절' ? 'lm-alert' : ''}>{stock}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function NoticesSlide() {
  const rows = [
    ['기상 악화에 따른 운영 안내', '전체 대상', '긴급'],
    ['부스 운영 종료 시간 안내', '스태프 · 부스 운영자', ''],
    ['메인 무대 공연 일정 변경', '일반 방문객', ''],
    ['행사장 안전 수칙 안내', '전체 대상', ''],
  ]
  return (
    <div className="lm-card lm-notices">
      <b>공지</b>
      {rows.map(([title, who, urgent]) => (
        <div className="lm-notice" key={title}>
          <span className="lm-notice-top">
            <strong>{title}</strong>
            {urgent && <em>{urgent}</em>}
          </span>
          <small>{who}</small>
        </div>
      ))}
    </div>
  )
}

const BODY = {
  dashboard: DashboardSlide,
  map: MapSlide,
  booths: BoothsSlide,
  live: LiveSlide,
  notices: NoticesSlide,
}

export default function LandingMockup() {
  const [active, setActive] = useState(0)
  const [scale, setScale] = useState(1)
  const wrapRef = useRef(null)

  // Shrink / grow the fixed-size drawing to the width the layout gives it.
  useEffect(() => {
    const el = wrapRef.current
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1.8, entry.contentRect.width / BASE_W)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const go = (step) => setActive((i) => (i + step + SLIDES.length) % SLIDES.length)

  const slide = SLIDES[active]

  return (
    <div className="lm-outer" style={{ '--slide-ms': `${SLIDE_MS}ms` }}>
      <div className="lm-wrap" ref={wrapRef} style={{ height: BASE_H * scale }}>
        <div className="lm" style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <div className="lm-bar">
            <i />
            <i />
            <i />
            <span>boothluck.kr</span>
          </div>
          <div className="lm-app">
            <aside className="lm-side">
              <p className="lm-logo">부스럭</p>
              <div className="lm-event">
                <strong>비룡제 2026</strong>
                <i>진행 중</i>
              </div>
              {SLIDES.map((s, i) => (
                <span key={s.key} className={`lm-nav${i === active ? ' is-active' : ''}`}>
                  <Icon name={s.icon} />
                  {s.nav}
                </span>
              ))}
            </aside>
            <div className="lm-main">
              <p className="lm-crumb">행사 운영 / {slide.nav}</p>
              <div className="lm-stack">
                {SLIDES.map((s, i) => {
                  const Body = BODY[s.key]
                  return (
                    <section key={s.key} className={`lm-slide${i === active ? ' is-active' : ''}`}>
                      <div className="lm-head">
                        <div>
                          <h4>{s.title}</h4>
                          <p>{s.sub}</p>
                        </div>
                        {s.key === 'dashboard' && <i className="lm-chip is-on">진행 중</i>}
                      </div>
                      <Body />
                    </section>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption + controls under the picture. The progress bar of the current screen is a CSS
          animation: when it ends the next screen comes up, so hovering (which pauses the
          animation) stops the slideshow, and "reduce motion" turns it off. */}
      <div className="lm-caption">
        <div className="lm-caption-text" key={slide.key}>
          <span className="lm-count">
            {String(active + 1).padStart(2, '0')}
            <em> / {String(SLIDES.length).padStart(2, '0')}</em>
          </span>
          <strong>{slide.caption[0]}</strong>
          <small>{slide.caption[1]}</small>
        </div>
        <div className="lm-controls">
          <div className="lm-segs" role="tablist" aria-label="운영 화면 미리보기">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`${s.nav} 화면 보기`}
                className={`lm-seg${i === active ? ' is-active' : ''}${i < active ? ' is-done' : ''}`}
                onClick={() => setActive(i)}
              >
                <i onAnimationEnd={i === active ? () => go(1) : undefined} />
              </button>
            ))}
          </div>
          <div className="lm-arrows">
            <button type="button" aria-label="이전 화면" onClick={() => go(-1)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 5-7 7 7 7" />
              </svg>
            </button>
            <button type="button" aria-label="다음 화면" onClick={() => go(1)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
