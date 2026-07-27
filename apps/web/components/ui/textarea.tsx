import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 resize-none',
        className
      )}
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)', ...style }}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
