'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { AuthState, signInWithDiscord, signInWithGoogle, signUp } from '../actions';

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null);

  return (
    <div className='card w-full max-w-sm bg-base-200 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title'>Sign Up</h2>

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

        <div className='divider'>or</div>

        <div className='flex flex-col gap-2'>
          <form action={signInWithGoogle}>
            <button type='submit' className='btn btn-outline w-full'>
              <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 48 48'>
                <path
                  fill='#FFC107'
                  d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
                />
                <path
                  fill='#FF3D00'
                  d='m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z'
                />
                <path
                  fill='#4CAF50'
                  d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'
                />
                <path
                  fill='#1976D2'
                  d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
                />
              </svg>
              Continue with Google
            </button>
          </form>
          <form action={signInWithDiscord}>
            <button type='submit' className='btn btn-outline w-full'>
              <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='#5865F2'>
                <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z' />
              </svg>
              Continue with Discord
            </button>
          </form>
        </div>

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
