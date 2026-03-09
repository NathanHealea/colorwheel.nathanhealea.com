import clsx from 'clsx';
import type { ComponentProps } from 'react';

const BUTTON_VARIANTS = ['default', 'outline', 'ghost'] as const;
type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BUTTON_COLORS = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error', 'neutral'] as const;
type ButtonColor = (typeof BUTTON_COLORS)[number];

const BUTTON_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
type ButtonSize = (typeof BUTTON_SIZES)[number];

const BUTTON_SHAPES = ['default', 'circle'] as const;
type ButtonShape = (typeof BUTTON_SHAPES)[number];

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: ButtonShape;
  block?: boolean;
  customColor?: string;
  customContentColor?: string;
  active?: boolean;
}

export default function Button({
  variant = 'default',
  color,
  size = 'sm',
  shape,
  block,
  customColor,
  customContentColor = '#fff',
  active,
  className,
  style,
  children,
  ...rest
}: ButtonProps) {
  const btnBase = 'btn btn-outline';
  const btnVariant = variant in BUTTON_VARIANTS ? `btn-${variant}` : '';
  const btnColor = color && color in BUTTON_COLORS ? `btn-${color}` : '';
  const btnSize = size in BUTTON_SIZES ? `btn-${size}` : '';
  const btnShape = shape === 'circle' ? 'btn-circle' : '';
  const btnActive = active ? 'btn-active' : '';
  const btnBlock = block ? 'btn-block' : '';

  let computedStyle: React.CSSProperties | undefined = style;
  if (customColor) {
    if (active) {
      computedStyle = {
        backgroundColor: customColor,
        borderColor: customColor,
        color: customContentColor,
        ...style,
      };
    } else {
      computedStyle = {
        borderColor: customColor,
        color: customColor,
        ...style,
      };
    }
  }

  return (
    <button
      className={clsx(btnBase, btnVariant, btnColor, btnSize, btnShape, btnActive, btnBlock, className)}
      style={computedStyle}
      {...rest}>
      {children}
    </button>
  );
}
