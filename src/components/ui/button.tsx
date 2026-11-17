import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Track-meet buttons: flat, hairline borders, small radii.
 * `primary` is the single loud action (Run); it has a solid offset shadow that the press "lands" into.
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none',
    'font-medium leading-none rounded-[var(--radius-md)] border',
    'transition-[transform,opacity,background-color,border-color,color] duration-150 ease-[var(--ease-out-quart)]',
    'disabled:pointer-events-none disabled:opacity-45',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-track',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-line-strong bg-track text-on-track font-semibold',
          'shadow-[2px_2px_0_0_var(--line-strong)] hover:bg-track-hover',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        ],
        outline: 'border-line bg-surface text-ink hover:border-line-strong',
        ghost: 'border-transparent bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
        danger: 'border-danger bg-danger text-paper hover:opacity-90',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-9 px-4 text-sm',
        icon: 'size-8',
        'icon-sm': 'size-7',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
