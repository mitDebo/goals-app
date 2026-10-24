// How dates are written across the app. Prototype: the choice is kept in this browser only
// (like light/dark), not in your profile on the server.
export type DateFormatId = 'd-mon-y' | 'd-month-y' | 'mon-d-y' | 'month-d-y' | 'mdy-slash' | 'dmy-slash' | 'iso'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const STORAGE_KEY = 'dateFormat'
const pad = (n: number) => String(n).padStart(2, '0')

type Parts = { y: number; m: number; d: number; month: string; mon: string }

// Each choice, in the order the Settings list shows them. The first one is the default.
export const dateFormats: { id: DateFormatId; write: (p: Parts) => string }[] = [
  { id: 'd-mon-y', write: (p) => `${p.d} ${p.mon} ${p.y}` },
  { id: 'd-month-y', write: (p) => `${p.d} ${p.month} ${p.y}` },
  { id: 'mon-d-y', write: (p) => `${p.mon} ${p.d}, ${p.y}` },
  { id: 'month-d-y', write: (p) => `${p.month} ${p.d}, ${p.y}` },
  { id: 'mdy-slash', write: (p) => `${pad(p.m)}/${pad(p.d)}/${p.y}` },
  { id: 'dmy-slash', write: (p) => `${pad(p.d)}/${pad(p.m)}/${p.y}` },
  { id: 'iso', write: (p) => `${p.y}-${pad(p.m)}-${pad(p.d)}` },
]

// Writes a "2026-10-19" date in the chosen style.
export function formatDate(iso: string, id: DateFormatId) {
  const [y, m, d] = iso.split('-').map(Number)
  const month = MONTHS[m - 1]
  const format = dateFormats.find((f) => f.id === id) ?? dateFormats[0]
  return format.write({ y, m, d, month, mon: month.slice(0, 3) })
}

export function savedDateFormat(): DateFormatId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (dateFormats.some((f) => f.id === saved)) return saved as DateFormatId
  } catch {
    // Storage can be blocked (e.g. private windows); use the default.
  }
  return dateFormats[0].id
}

export function saveDateFormat(id: DateFormatId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Not remembered; nothing else to do.
  }
}

// The short dates over each day in the week grid: just day and month (the year is obvious there).
// A separate choice from the full date format. Kept in this browser too.
export type ShortDateFormatId = 'd-mon' | 'mon-d' | 'm/d' | 'd/m' | 'm-d'

const SHORT_STORAGE_KEY = 'shortDateFormat'

// Each choice, in the order the Settings list shows them. The first one is the default.
export const shortDateFormats: { id: ShortDateFormatId; write: (p: Parts) => string }[] = [
  { id: 'd-mon', write: (p) => `${p.d} ${p.mon}` },
  { id: 'mon-d', write: (p) => `${p.mon} ${p.d}` },
  { id: 'm/d', write: (p) => `${pad(p.m)}/${pad(p.d)}` },
  { id: 'd/m', write: (p) => `${pad(p.d)}/${pad(p.m)}` },
  { id: 'm-d', write: (p) => `${pad(p.m)}-${pad(p.d)}` },
]

export function formatShortDate(iso: string, id: ShortDateFormatId) {
  const [y, m, d] = iso.split('-').map(Number)
  const month = MONTHS[m - 1]
  const format = shortDateFormats.find((f) => f.id === id) ?? shortDateFormats[0]
  return format.write({ y, m, d, month, mon: month.slice(0, 3) })
}

export function savedShortDateFormat(): ShortDateFormatId {
  try {
    const saved = localStorage.getItem(SHORT_STORAGE_KEY)
    if (shortDateFormats.some((f) => f.id === saved)) return saved as ShortDateFormatId
  } catch {
    // Storage can be blocked (e.g. private windows); use the default.
  }
  return shortDateFormats[0].id
}

export function saveShortDateFormat(id: ShortDateFormatId) {
  try {
    localStorage.setItem(SHORT_STORAGE_KEY, id)
  } catch {
    // Not remembered; nothing else to do.
  }
}
