'use client'

import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/** Map of align prop values to CSS class names. */
const addonAlignClass = {
  'inline-start': 'input-group-addon input-group-addon-start',
  'inline-end': 'input-group-addon input-group-addon-end',
  'block-start': 'input-group-addon input-group-addon-top',
  'block-end': 'input-group-addon input-group-addon-bottom',
} as const

/** Map of button size prop values to CSS class names. */
const buttonSizeClass = {
  xs: 'input-group-btn input-group-btn-xs',
  sm: 'input-group-btn',
  'icon-xs': 'input-group-btn input-group-btn-icon-xs',
  'icon-sm': 'input-group-btn input-group-btn-icon-sm',
} as const

function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn('input-group', className)}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: ComponentProps<'div'> & {
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end'
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(addonAlignClass[align], className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        e.currentTarget.parentElement?.querySelector('input')?.focus()
      }}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  type = 'button',
  size = 'xs',
  ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'type'> & {
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm'
  type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <Button
      type={type}
      data-size={size}
      className={cn('btn-ghost', buttonSizeClass[size], className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn('input-group-text', className)}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn('input-group-control', className)}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn('input-group-control', className)}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
