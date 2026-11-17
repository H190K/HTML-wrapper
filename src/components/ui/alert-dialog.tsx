import { AlertDialog as A } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/cn';

export const AlertDialog = A.Root;
export const AlertDialogTrigger = A.Trigger;
export const AlertDialogCancel = A.Cancel;
export const AlertDialogAction = A.Action;

export function AlertDialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof A.Content>) {
  return (
    <A.Portal>
      <A.Overlay className="ui-fade fixed inset-0 z-50 bg-ink/40" />
      <A.Content
        className={cn(
          'ui-pop fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5 text-ink shadow-[4px_4px_0_0_var(--line-strong)]',
          className,
        )}
        {...props}
      >
        {children}
      </A.Content>
    </A.Portal>
  );
}

export const AlertDialogTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof A.Title>) => (
  <A.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
);

export const AlertDialogDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof A.Description>) => (
  <A.Description className={cn('mt-2 text-sm text-ink-2', className)} {...props} />
);
