const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const lerp = (a, b, t) => a + (b - a) * t
const range = (v, from, to) => clamp((v - from) / (to - from))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]

let vw = window.innerWidth
let vh = window.innerHeight
let scrollY = window.scrollY

/* ---------- Intro: the spinning logo flies into the nav ---------- */

// The mark fills 425/1080 of the video's height and 92.05/100 of the SVG's,
// and is centred in both, so matching centres and heights lines them up.
const MARK_IN_VIDEO = 425 / 1080
const MARK_IN_SVG = 92.05 / 100
const TURN_SECONDS = 4 // one full turn of the video at 1x
const MAX_RATE = 6

const intro = $('.intro')
const flyer = $('.flyer')
const navMark = $('.nav__mark')
const navMarkSvg = $('svg', navMark)
const navCc = $('.nav__cc')
const navFades = [$('.nav__name'), $('.nav__links'), navCc]
const hint = $('.intro__hint')
const titleLines = $$('.intro__title .line > span')
const lede = $('.intro__lede')

const fly = { size: 0, x0: 0, y0: 0, x1: 0, y1: 0, scale1: 1, span: 1 }
let introP = 0
let docked = false
let settle = null
let lastRate = 1

function measureIntro() {
  const r = navMark.getBoundingClientRect()
  fly.size = Math.min(vw * 1.2, vh * 0.95)
  fly.x0 = vw / 2
  fly.y0 = vh * 0.47
  fly.x1 = r.left + r.width / 2
  fly.y1 = r.top + r.height / 2
  fly.scale1 = (r.height * MARK_IN_SVG) / MARK_IN_VIDEO / fly.size
  fly.span = Math.max(1, intro.offsetHeight - vh)
  flyer.style.width = flyer.style.height = `${fly.size}px`
}

// Lay the orange ".cc" exactly over the blank slot left for it in the nav
function placeCc() {
  navCc.style.transform = ''
  const slot = $('.nav__cc-slot').getBoundingClientRect()
  const own = navCc.firstElementChild.getBoundingClientRect()
  navCc.style.transform = `translate(${slot.left - own.left}px, ${slot.top - own.top}px)`
}

function dock(instant) {
  docked = true
  flyer.classList.add('is-docked')
  navMark.classList.add('is-docked')
  flyer.pause()
  if (instant) return

  // Carry the video's angle and speed over to the SVG, then let it coast to rest face-on
  const angle = ((flyer.currentTime % TURN_SECONDS) / TURN_SECONDS) * 360
  const rest = 360 - angle
  const distance = rest < 180 ? rest + 360 : rest
  const speed = (360 / TURN_SECONDS) * lastRate
  settle = { from: angle, distance, duration: (3 * distance) / speed, start: performance.now() }
}

function undock() {
  docked = false
  settle = null
  navMarkSvg.style.transform = ''
  flyer.classList.remove('is-docked')
  navMark.classList.remove('is-docked')
  flyer.play().catch(() => {})
}

function updateIntro(now) {
  const p = introP

  if (!docked && p > 0.995) dock(false)
  else if (docked && p < 0.97) undock()

  if (!docked) {
    const t = easeInOut(range(p, 0.1, 1))
    const x = lerp(fly.x0, fly.x1, t)
    const y = lerp(fly.y0, fly.y1, t)
    const s = lerp(1, fly.scale1, t)
    flyer.style.transform = `translate3d(${x - fly.size / 2}px, ${y - fly.size / 2}px, 0) scale(${s})`

    const rate = 1 + (MAX_RATE - 1) * p * p
    if (Math.abs(rate - lastRate) > 0.04) {
      flyer.playbackRate = lastRate = rate
    }
  }

  if (settle) {
    const t = clamp((now - settle.start) / 1000 / settle.duration)
    const angle = settle.from + settle.distance * easeOut(t)
    navMarkSvg.style.transform = t < 1 ? `rotateY(${angle}deg)` : ''
    if (t >= 1) settle = null
  }

  hint.style.opacity = 1 - range(p, 0, 0.1)
  titleLines.forEach((line, i) => {
    const q = easeOut(range(p, 0.42 + i * 0.07, 0.8 + i * 0.07))
    line.style.transform = `translateY(${(1 - q) * 112}%)`
  })
  lede.style.opacity = range(p, 0.78, 0.96)

  const navIn = range(p, 0.7, 0.95)
  navFades.forEach((el) => {
    el.style.opacity = navIn
    el.style.visibility = navIn > 0.01 ? 'visible' : 'hidden'
  })
}

/* ---------- About: word-by-word reveal ---------- */

const wordsEl = $('[data-words]')
const words = []

function splitWords() {
  const text = wordsEl.textContent.trim().split(/\s+/)
  wordsEl.textContent = ''
  text.forEach((word, i) => {
    const span = document.createElement('span')
    span.className = 'w'
    span.textContent = word
    wordsEl.append(span, i < text.length - 1 ? ' ' : '')
    words.push(span)
  })
}

function updateWords() {
  const r = wordsEl.getBoundingClientRect()
  if (r.bottom < 0 || r.top > vh) return
  const p = range(vh * 0.82 - r.top, 0, r.height + vh * 0.3)
  const head = p * (words.length + 4)
  words.forEach((w, i) => {
    w.style.opacity = 0.14 + 0.86 * clamp((head - i) / 4)
  })
}

/* ---------- Parallax ---------- */

const layers = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed), mid: 0 }))

function measureLayers() {
  layers.forEach((l) => {
    l.el.style.transform = ''
    const r = l.el.getBoundingClientRect()
    l.mid = r.top + scrollY + r.height / 2
  })
}

function updateLayers() {
  layers.forEach((l) => {
    const offset = l.mid - (scrollY + vh / 2)
    if (Math.abs(offset) > vh * 1.5) return
    l.el.style.transform = `translate3d(0, ${offset * l.speed}px, 0)`
  })
}

/* ---------- Band ---------- */

const band = $('.band')
const BAND_SPEED = 0.3 // px the rows slide per px scrolled
const bandRows = $$('.band__row').map((el) => ({ el, dir: Number(el.dataset.dir), travel: 0 }))
let bandTop = 0

function measureBand() {
  bandTop = band.getBoundingClientRect().top + scrollY
  const distance = (vh + band.offsetHeight) * BAND_SPEED
  bandRows.forEach((r) => (r.travel = Math.min(distance, Math.max(0, r.el.scrollWidth - vw))))
}

function updateBand() {
  const p = range(scrollY, bandTop - vh, bandTop + band.offsetHeight)
  bandRows.forEach((r) => {
    const x = r.dir < 0 ? -p * r.travel : -(1 - p) * r.travel
    r.el.style.transform = `translate3d(${x}px, 0, 0)`
  })
}

/* ---------- Process: pinned horizontal scroll ---------- */

const process = $('.process')
const track = $('.process__track')
const bar = $('.process__bar i')
const nums = $$('.step__num')
const proc = { top: 0, travel: 0, pinned: false }

function measureProcess() {
  proc.pinned = !reduced && vw > 760 && vh > 560
  process.classList.toggle('is-pinned', proc.pinned)
  track.style.transform = ''
  process.style.height = ''
  if (!proc.pinned) {
    nums.forEach((n) => (n.style.transform = ''))
    return
  }
  proc.travel = Math.max(0, track.scrollWidth - vw)
  process.style.height = `${vh + proc.travel}px`
  proc.top = process.getBoundingClientRect().top + scrollY
}

function updateProcess() {
  if (!proc.pinned) return
  const p = range(scrollY, proc.top, proc.top + proc.travel)
  track.style.transform = `translate3d(${-p * proc.travel}px, 0, 0)`
  bar.style.setProperty('--p', p.toFixed(4))
  nums.forEach((n, i) => {
    const local = p * (nums.length - 1) - i
    n.style.transform = `translate3d(${local * 90}px, 0, 0)`
  })
}

/* ---------- Contact: the mark draws itself ---------- */

const drawEl = $('[data-draw]')

function updateDraw() {
  const r = drawEl.getBoundingClientRect()
  if (r.bottom < 0 || r.top > vh) return
  const p = easeInOut(range(vh - r.top, vh * 0.1, vh * 0.2 + r.height))
  drawEl.style.setProperty('--draw', (1 - p).toFixed(4))
}

/* ---------- Services: the hover fill enters and leaves by the edge the pointer crossed ---------- */

function initLedger() {
  $$('.ledger__row a').forEach((row) => {
    const edge = (e) => {
      const r = row.getBoundingClientRect()
      row.style.setProperty('--o', e.clientY < r.top + r.height / 2 ? 'top' : 'bottom')
    }
    row.addEventListener('pointerenter', edge)
    row.addEventListener('pointerleave', edge)
  })
}

/* ---------- Nav: orange underline on a layer of its own, outside the nav's blend ---------- */

function initNavLines() {
  const layer = document.createElement('div')
  layer.className = 'nav-lines'
  layer.setAttribute('aria-hidden', 'true')
  document.body.append(layer)

  $$('.nav__links a').forEach((link) => {
    const line = document.createElement('i')
    layer.append(line)

    const show = () => {
      const r = link.getBoundingClientRect()
      line.style.left = `${r.left}px`
      line.style.top = `${r.bottom - 1}px`
      line.style.width = `${r.width}px`
      line.classList.add('is-on')
    }
    const hide = () => line.classList.remove('is-on')

    link.addEventListener('pointerenter', show)
    link.addEventListener('pointerleave', hide)
    link.addEventListener('focus', () => link.matches(':focus-visible') && show())
    link.addEventListener('blur', hide)
  })
}

/* ---------- Cursor ---------- */

const TAIL = 6 // links in the tail that trails behind the dot

function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const layer = document.createElement('div')
  layer.className = 'cursor'
  layer.setAttribute('aria-hidden', 'true')

  // The tail is a chain of round-capped strokes, each thinner than the last.
  // Same white as the dot and overlapping it, so the two read as one tapering shape.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const tail = Array.from({ length: reduced ? 0 : TAIL }, (_, i) => {
    const el = document.createElementNS(svg.namespaceURI, 'line')
    svg.append(el)
    return { el, x: 0, y: 0, width: 1 - (i + 0.5) / TAIL }
  })
  const dot = document.createElement('i')
  layer.append(svg, dot)
  document.body.append(layer)

  const pos = { x: 0, y: 0, tx: 0, ty: 0, s: 1, ts: 1 }
  let down = false
  let running = false

  const aim = () => (pos.ts = down ? 0.75 : 1)
  const place = (el, x, y, s) =>
    (el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`)

  function tick() {
    const k = reduced ? 1 : 0.22
    pos.x = lerp(pos.x, pos.tx, k)
    pos.y = lerp(pos.y, pos.ty, k)
    pos.s = lerp(pos.s, pos.ts, reduced ? 1 : 0.16)
    place(dot, pos.x, pos.y, pos.s)

    // each link chases the one ahead of it, so the tail stretches with speed
    const size = dot.offsetWidth * pos.s
    let lead = pos
    tail.forEach((t) => {
      t.x = lerp(t.x, lead.x, 0.5)
      t.y = lerp(t.y, lead.y, 0.5)
      t.el.setAttribute('x1', lead.x)
      t.el.setAttribute('y1', lead.y)
      t.el.setAttribute('x2', t.x)
      t.el.setAttribute('y2', t.y)
      t.el.setAttribute('stroke-width', size * t.width)
      lead = t
    })

    const still =
      Math.abs(pos.tx - lead.x) < 0.1 && Math.abs(pos.ty - lead.y) < 0.1 && Math.abs(pos.ts - pos.s) < 0.005
    running = !still
    if (running) requestAnimationFrame(tick)
  }

  const wake = () => {
    if (running) return
    running = true
    requestAnimationFrame(tick)
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    pos.tx = e.clientX
    pos.ty = e.clientY
    if (!layer.classList.contains('is-on')) {
      // first sighting: appear under the pointer instead of sliding in from the corner
      pos.x = pos.tx
      pos.y = pos.ty
      tail.forEach((t) => ((t.x = pos.tx), (t.y = pos.ty)))
      layer.classList.add('is-on')
      document.documentElement.classList.add('has-cursor')
    }
    wake()
  })

  window.addEventListener('pointerdown', () => ((down = true), aim(), wake()))
  window.addEventListener('pointerup', () => ((down = false), aim(), wake()))
  document.documentElement.addEventListener('mouseleave', () => layer.classList.remove('is-on'))
}

/* ---------- Reveals ---------- */

function watchReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      })
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  $$('[data-reveal]').forEach((el) => io.observe(el))
}

/* ---------- Loop ---------- */

function measure() {
  vw = window.innerWidth
  vh = window.innerHeight
  scrollY = window.scrollY
  measureProcess() // changes page height, so it goes first
  measureIntro()
  placeCc()
  measureLayers()
  measureBand()
}

function frame(now) {
  scrollY = window.scrollY
  const target = clamp(scrollY / fly.span)
  introP = Math.abs(target - introP) < 0.0005 ? target : lerp(introP, target, 0.14)

  updateIntro(now)
  updateWords()
  updateLayers()
  updateBand()
  updateProcess()
  updateDraw()
  requestAnimationFrame(frame)
}

function start() {
  $('#ano').textContent = new Date().getFullYear()
  watchReveals()
  initCursor()
  initLedger()
  initNavLines()

  if (reduced) {
    // Static page: logo already in the nav, nothing pinned or scrubbed
    flyer.remove()
    navMark.classList.add('is-docked')
    measureProcess()
    placeCc()
    window.addEventListener('resize', placeCc)
    document.fonts?.ready.then(placeCc)
    return
  }

  splitWords()
  measure()

  introP = clamp(scrollY / fly.span)
  if (introP > 0.995) dock(true)

  const ready = () => flyer.classList.add('is-ready')
  if (flyer.readyState >= 2) ready()
  else flyer.addEventListener('loadeddata', ready, { once: true })
  flyer.play().catch(() => {})

  window.addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
  requestAnimationFrame(frame)
}

start()
