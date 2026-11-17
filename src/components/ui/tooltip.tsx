import { Tooltip as T } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/cn';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <T.Provider delayDuration={350} skipDelayDuration={200}>
    {children}
  </T.Provider>
);

interface TipProps {
  label: React.ReactNode;
  /** Optional keyboard shortcut, rendered as a mono hint. */
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
}

/** Tooltip shown on hover and on keyboard focus. The trigger keeps its own accessible name. */
export function Tip({ label, shortcut, side = 'bottom', children }: TipProps) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'ui-pop z-50 flex items-center gap-2 rounded-[var(--radius-sm)] border border-line-strong',
            'bg-ink px-2 py-1 text-xs font-medium text-paper',
          )}
        >
          {label}
          {shortcut && <kbd className="font-mono text-[0.6875rem] opacity-70">{shortcut}</kbd>}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
