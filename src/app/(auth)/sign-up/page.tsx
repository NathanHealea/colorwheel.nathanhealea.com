'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { AuthState, signUp } from '../actions';

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null);

  return (
    <div className='card w-full max-w-sm bg-base-200 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title'>Sign Up</h2>

        {state?.success && (
          <div role='alert' className='alert alert-success'>
            <span>{state.success}</span>
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
              <span className='label-text'>Email</span>
            </div>
            <input
              type='email'
              name='email'
              placeholder='you@example.com'
              className='input input-bordered w-full'
              required
            />
          </label>

          <label className='form-control w-full'>
            <div className='label'>
              <span className='label-text'>Password</span>
            </div>
            <input
              type='password'
              name='password'
              placeholder='••••••••'
              className='input input-bordered w-full'
              minLength={6}
              required
            />
          </label>

          <button type='submit' className='btn btn-primary w-full' disabled={pending}>
            {pending ? <span className='loading loading-spinner' /> : 'Sign Up'}
          </button>
        </form>

        <p className='text-center text-sm'>
          Already have an account?{' '}
          <Link href='/sign-in' className='link link-primary'>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
