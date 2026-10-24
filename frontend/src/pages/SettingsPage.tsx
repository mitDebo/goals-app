import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { getProfile, updateProfile, type WeekStart } from '@/profile/api'
import {
  dateFormats,
  formatDate,
  formatShortDate,
  saveDateFormat,
  savedDateFormat,
  saveShortDateFormat,
  savedShortDateFormat,
  shortDateFormats,
  type DateFormatId,
  type ShortDateFormatId,
} from '@/settings/dateFormat'

// Each date format is shown as an example, using today's date.
const exampleDay = new Date().toISOString().slice(0, 10)

const selectClass = 'rounded-md border bg-background px-2 py-1'

type Status = { kind: 'idle' } | { kind: 'saved' } | { kind: 'error'; messages: string[] }

export function SettingsPage({ session }: { session: Session }) {
  const [timeZone, setTimeZone] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<WeekStart>('sunday')
  const [dateFormat, setDateFormat] = useState<DateFormatId>(savedDateFormat)
  const [shortDateFormat, setShortDateFormat] = useState<ShortDateFormatId>(savedShortDateFormat)
  const [loadFailed, setLoadFailed] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    getProfile(session.access_token).then((profile) => {
      if (!profile) return setLoadFailed(true)
      setTimeZone(profile.timeZone)
      setWeekStart(profile.weekStart)
    })
  }, [session.access_token])

  // Every zone the browser knows, plus the saved one in case it isn't listed.
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf('timeZone')
    return timeZone && !all.includes(timeZone) ? [timeZone, ...all] : all
  }, [timeZone])

  const save = async () => {
    if (!timeZone) return
    saveDateFormat(dateFormat)
    saveShortDateFormat(shortDateFormat)
    const result = await updateProfile(session.access_token, { timeZone, weekStart })
    setStatus(result.ok ? { kind: 'saved' } : { kind: 'error', messages: result.errors })
  }

  if (loadFailed) return <p>Couldn't load your settings.</p>
  if (!timeZone) return <p>Loading…</p>

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-xl font-semibold">Settings</h2>

      <label className="flex flex-col gap-1">
        Time zone
        <select
          className={selectClass}
          value={timeZone}
          onChange={(e) => {
            setTimeZone(e.target.value)
            setStatus({ kind: 'idle' })
          }}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Week starts on
        <select
          className={selectClass}
          value={weekStart}
          onChange={(e) => {
            setWeekStart(e.target.value as WeekStart)
            setStatus({ kind: 'idle' })
          }}
        >
          <option value="sunday">Sunday</option>
          <option value="monday">Monday</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Date format
        <select
          className={selectClass}
          value={dateFormat}
          onChange={(e) => {
            setDateFormat(e.target.value as DateFormatId)
            setStatus({ kind: 'idle' })
          }}
        >
          {dateFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {formatDate(exampleDay, format.id)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Short date format (the dates over each day)
        <select
          className={selectClass}
          value={shortDateFormat}
          onChange={(e) => {
            setShortDateFormat(e.target.value as ShortDateFormatId)
            setStatus({ kind: 'idle' })
          }}
        >
          {shortDateFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {formatShortDate(exampleDay, format.id)}
            </option>
          ))}
        </select>
      </label>

      <Button onClick={save}>Save</Button>

      {status.kind === 'saved' && <p>Settings saved.</p>}
      {status.kind === 'error' && (
        <p role="alert" className="text-destructive">
          {status.messages.join(' ')}
        </p>
      )}

      <Link to="/" className="underline">
        Back
      </Link>
    </section>
  )
}
