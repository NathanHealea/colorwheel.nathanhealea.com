'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ProfileFormState, validateDisplayName } from '@/modules/profile/validation'

import { setupProfile } from './actions'

export function ProfileForm() {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(setupProfile, null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget)
    const displayName = (formData.get('display_name') as string) ?? ''
    const error = validateDisplayName(displayName)

    if (error) {
      // Let the browser prevent submission so the server action doesn't fire
      e.preventDefault()
      return
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {state?.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <div className="form-item">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          placeholder="e.g. Ragnar_42"
          required
          minLength={2}
          maxLength={50}
          pattern="^[a-zA-Z0-9_-]+$"
          autoComplete="username"
        />
        {state?.errors?.display_name ? (
          <p className="form-message text-sm text-destructive">{state.errors.display_name}</p>
        ) : (
          <p className="text-sm text-muted-foreground">2-50 characters. Letters, numbers, hyphens, and underscores only.</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Complete setup'}
      </Button>
    </form>
  )
}
