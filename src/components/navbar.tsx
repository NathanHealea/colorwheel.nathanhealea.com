import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-start">
        <Link href="/" className="navbar-brand">
          Grimify
        </Link>
      </div>
      <div className="navbar-end">
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Sign In
        </Link>
        <Link href="/sign-up" className={cn(buttonVariants({ size: 'sm' }))}>
          Sign Up
        </Link>
      </div>
    </nav>
  )
}
