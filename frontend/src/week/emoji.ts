// Emoji suggested while typing a choice option, each with words it matches. The first ones are what's
// shown before anything is typed. (A small hand-picked set for the prototype, not every emoji.)
const EMOJI: [string, string][] = [
  ['👍', 'yes good ok up thumbs'],
  ['👎', 'no bad down thumbs'],
  ['😀', 'happy great smile good'],
  ['🙂', 'ok fine okay smile'],
  ['😐', 'meh neutral ok so-so'],
  ['🙁', 'sad bad unhappy'],
  ['😫', 'awful terrible tired exhausted'],
  ['😴', 'sleep tired rest nap'],
  ['🏃', 'run running jog cardio'],
  ['🚶', 'walk walking stroll steps'],
  ['🚴', 'bike cycle cycling ride'],
  ['🏊', 'swim swimming pool'],
  ['🏋️', 'lift weights gym strength'],
  ['🧘', 'yoga meditate stretch calm'],
  ['🛋️', 'rest couch relax sofa lazy'],
  ['⚽', 'football soccer sport ball'],
  ['🏀', 'basketball sport ball'],
  ['🎾', 'tennis sport ball'],
  ['🥾', 'hike hiking boots trail'],
  ['💪', 'strong strength workout muscle'],
  ['🥗', 'salad healthy vegetables food'],
  ['🍎', 'apple fruit healthy food'],
  ['🍕', 'pizza junk food takeout'],
  ['🍔', 'burger junk food fast'],
  ['🍳', 'cook cooking breakfast eggs'],
  ['☕', 'coffee caffeine drink'],
  ['🍵', 'tea drink'],
  ['💧', 'water drink hydrate'],
  ['🍺', 'beer alcohol drink'],
  ['🍷', 'wine alcohol drink'],
  ['🚭', 'no smoking quit'],
  ['📚', 'read reading books study'],
  ['✍️', 'write writing journal'],
  ['💻', 'work computer code coding'],
  ['🎮', 'game games gaming play'],
  ['🎸', 'guitar music play practice'],
  ['🎹', 'piano music keys practice'],
  ['🎨', 'art paint draw creative'],
  ['📺', 'tv television watch show'],
  ['📱', 'phone screen social'],
  ['🧹', 'clean cleaning chores tidy'],
  ['🧺', 'laundry chores washing'],
  ['🛒', 'shopping groceries shop'],
  ['💰', 'money save saving budget'],
  ['🏠', 'home house stay'],
  ['🏢', 'office work commute'],
  ['🚗', 'car drive driving'],
  ['🚌', 'bus transit commute'],
  ['👨‍👩‍👧', 'family kids home'],
  ['❤️', 'love heart partner date'],
  ['🐕', 'dog walk pet'],
  ['🌳', 'outside nature park tree'],
  ['☀️', 'sun sunny morning day'],
  ['🌙', 'night evening moon late'],
  ['⭐', 'star best great'],
  ['🔥', 'fire hot streak great'],
  ['✅', 'done yes complete check'],
  ['❌', 'no fail skip missed'],
  ['⏭️', 'skip skipped next'],
  ['🤒', 'sick ill unwell'],
]

// Suggestions for what's been typed: emoji whose words start with any typed word. With nothing typed, the
// common ones. At most `limit`.
export function suggestEmoji(text: string, limit = 12): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return EMOJI.slice(0, limit).map(([e]) => e)
  return EMOJI.filter(([, keys]) => keys.split(' ').some((k) => words.some((w) => k.startsWith(w))))
    .slice(0, limit)
    .map(([e]) => e)
}

// The first emoji in some text (for when someone types or pastes an emoji straight into the name box).
export function firstEmoji(text: string): string | undefined {
  return text.match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}️?)*/u)?.[0]
}

// Every emoji in the list, in order (for the picker's "All" section).
export const ALL_EMOJI: string[] = EMOJI.map(([e]) => e)
