'use client'

import { useActionState } from 'react'

import { completeProfileSetup, ProfileSetupState } from './actions'

interface ProfileSetupFormProps {
  suggestedName?: string
  nameAlreadyTaken?: boolean
}

export default function ProfileSetupForm({ suggestedName, nameAlreadyTaken }: ProfileSetupFormProps) {
  const [state, formAction, pending] = useActionState<ProfileSetupState, FormData>(completeProfileSetup, null)

  return (
    <div className='card w-full max-w-sm bg-base-200 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title'>Set up your profile</h2>

        {nameAlreadyTaken && suggestedName && (
          <div role='alert' className='alert alert-warning'>
            <span>
              The name &apos;{suggestedName}&apos; is already taken. Please choose a different one.
            </span>
          </div>
        )}

        {state?.error && (
          <div role='alert' className='alert alert-error'>
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className='flex flex-col gap-4'>
          <label className='form-control w-full'>
            <div className='label'>
              <span className='label-text'>Display Name</span>
            </div>
            <input
              type='text'
              name='display_name'
              defaultValue={nameAlreadyTaken ? '' : suggestedName}
              placeholder='Choose a display name'
              className='input input-bordered w-full'
              minLength={2}
              maxLength={30}
              required
            />
          </label>

          <button type='submit' className='btn btn-primary w-full' disabled={pending}>
            {pending ? <span className='loading loading-spinner' /> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
