import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

/** Dictionary of button sizes */
const SIZE: Record<string, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

/** Dictionary of button colors */
const COLORS: Record<string, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  neutral: 'btn-neutral',
  info: 'btn-info',
  success: 'btn-success',
  warning: 'btn-warning',
  error: 'btn-error',
};

interface ColorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in the active/selected state */
  active?: boolean;
  /** Text color when active (defaults to '#fff') */
  contentColor?: string;

  /** Size of the button (defaults to 'sm') */
  size?: (typeof SIZE)[keyof typeof SIZE];

  /** Color of the button (defaults to 'primary') */
  color?: (typeof COLORS)[keyof typeof COLORS];
}

export default function ColorButton({
  active,
  size = 'sm',
  color= 'primary',
  className = '',
  children,
  style,
  ...rest
}: ColorButtonProps) {
  const btnDefault = 'btn btn-outline';
  const btnSize = size in SIZE ? SIZE[size] : SIZE.sm;
  const btnActive = active ? '' : '';

  // When no custom color, fall back to DaisyUI btn-neutral
  if (!color) {
    return (
      <button className={clsx(btnDefault, btnSize, btnActive, className)} style={style} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <button
      className={clsx(btnDefault, btnSize, btnActive, className)}
      style={{
        // ...(active
        //   ? { backgroundColor: color, borderColor: color, color: contentColor }
        //   : { borderColor: color, color }),
        ...style,
      }}
      {...rest}>
      {children}
    </button>
  );
}
