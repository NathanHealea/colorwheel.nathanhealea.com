'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { removePaintFromPurchaseList } from '@/modules/admin/actions/remove-paint-from-purchase-list'
import { updatePurchaseListNote } from '@/modules/admin/actions/update-purchase-list-note'
import type { AdminPurchaseListEntry } from '@/modules/admin/types/admin-purchase-list-entry'

/** Maximum number of characters accepted in a purchase list note. Mirrors the server action cap. */
const MAX_NOTE_LENGTH = 500

/**
 * Client table rendering one user's purchase list with admin CRUD controls.
 *
 * Each row shows the paint swatch, name (linked to the public paint page),
 * brand, paint type, added date, an inline-editable note, and a remove control.
 * Notes save through {@link updatePurchaseListNote}; removal is a two-step
 * "arm then confirm" inline control so a single stray click cannot delete a row.
 * All mutation controls are hidden when `isSelf` — admins manage their own list
 * from `/purchase-list`.
 *
 * @param props.userId - UUID of the user whose purchase list is rendered.
 * @param props.entries - The user's purchase list entries, most recently added first.
 * @param props.isSelf - When true, the viewing admin owns this list and mutations are disabled.
 */
export function UserPurchaseListTable({
  userId,
  entries,
  isSelf,
}: {
  userId: string
  entries: AdminPurchaseListEntry[]
  isSelf: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-inset/50">
            <th className="px-4 py-3 text-left font-medium text-meta">Paint</th>
            <th className="px-4 py-3 text-left font-medium text-meta">Type</th>
            <th className="px-4 py-3 text-left font-medium text-meta">Added</th>
            <th className="px-4 py-3 text-left font-medium text-meta">Notes</th>
            <th className="px-4 py-3 text-right font-medium text-meta">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-meta">
                This user has no paints on their purchase list.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <PurchaseListEntryRow
                key={entry.paint_id}
                userId={userId}
                entry={entry}
                isSelf={isSelf}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function PurchaseListEntryRow({
  userId,
  entry,
  isSelf,
}: {
  userId: string
  entry: AdminPurchaseListEntry
  isSelf: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [isArmed, setIsArmed] = useState(false)

  const addedDate = new Date(entry.added_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  function handleRemove() {
    startTransition(async () => {
      const result = await removePaintFromPurchaseList(userId, entry.paint_id)
      if (result.error) {
        toast.error(result.error)
        setIsArmed(false)
        return
      }
      toast.success(`Removed '${entry.name}' from the purchase list`)
    })
  }

  return (
    <tr className="border-b border-rule last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="size-6 shrink-0 rounded border border-rule"
            style={{ backgroundColor: entry.hex }}
            aria-hidden="true"
          />
          <span className="flex flex-col">
            <Link href={`/paints/${entry.paint_id}`} className="font-medium hover:underline">
              {entry.name}
            </Link>
            <span className="text-xs text-meta">{entry.brand_name}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-meta">
        {entry.paint_type ?? <span className="italic">Untyped</span>}
      </td>
      <td className="px-4 py-3 text-meta">{addedDate}</td>
      <td className="px-4 py-3">
        <NoteCell userId={userId} entry={entry} isSelf={isSelf} />
      </td>
      <td className="px-4 py-3 text-right">
        {isSelf ? (
          <span className="text-xs text-meta">Your list</span>
        ) : isArmed ? (
          <span className="flex items-center justify-end gap-2">
            <Button
              type="button"
              className="btn-xs btn-ghost"
              onClick={() => setIsArmed(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-xs btn-destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? 'Removing…' : 'Confirm'}
            </Button>
          </span>
        ) : (
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-meta hover:bg-inset hover:text-danger disabled:opacity-50"
            aria-label={`Remove ${entry.name} from purchase list`}
            onClick={() => setIsArmed(true)}
            disabled={isPending}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </td>
    </tr>
  )
}

function NoteCell({
  userId,
  entry,
  isSelf,
}: {
  userId: string
  entry: AdminPurchaseListEntry
  isSelf: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(entry.notes ?? '')
  const [isPending, startTransition] = useTransition()

  if (isSelf || !isEditing) {
    const hasNote = (entry.notes ?? '').trim().length > 0

    if (isSelf) {
      return hasNote ? (
        <span className="text-meta">{entry.notes}</span>
      ) : (
        <span className="text-xs italic text-meta">No note</span>
      )
    }

    return (
      <button
        type="button"
        className="w-full max-w-64 truncate rounded-md px-2 py-1 text-left hover:bg-inset"
        onClick={() => {
          setValue(entry.notes ?? '')
          setIsEditing(true)
        }}
        aria-label={`Edit note for ${entry.name}`}
      >
        {hasNote ? (
          <span className="text-meta">{entry.notes}</span>
        ) : (
          <span className="text-xs italic text-meta">Add a note</span>
        )}
      </button>
    )
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePurchaseListNote(userId, entry.paint_id, value)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setIsEditing(false)
      toast.success('Note saved')
    })
  }

  return (
    <span className="flex items-center gap-2">
      <Input
        type="text"
        value={value}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        className="input-sm w-48"
        placeholder="Note…"
        aria-label={`Note for ${entry.name}`}
        autoComplete="off"
        autoFocus
      />
      <Button type="button" className="btn-xs btn-ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
        Cancel
      </Button>
      <Button type="button" className="btn-xs btn-primary" onClick={handleSave} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </span>
  )
}
