'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { signOut } from '@/modules/auth/actions/sign-out'

/**
 * User avatar dropdown menu for the navbar.
 *
 * Displays the user's profile picture (or initials fallback) and opens a
 * dropdown with account actions on click. Uses the native `<details>` element
 * for toggle state.
 *
 * @param props.displayName - The user's display name.
 * @param props.avatarUrl - URL to the user's profile picture, or `null` for the initials fallback.
 */
export function UserMenu({
  displayName,
  avatarUrl,
}: {
  displayName: string
  avatarUrl: string | null
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute('open')
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="btn btn-ghost btn-circle btn-sm list-none">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="avatar avatar-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="avatar avatar-sm avatar-placeholder">{initials}</span>
        )}
      </summary>
      <div className="dropdown-content">
        <div className="px-2 py-1.5 text-sm font-medium">{displayName}</div>
        <div className="my-1 h-px bg-border" />
        <form action={signOut}>
          <button type="submit" className="dropdown-item dropdown-item-destructive">
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
