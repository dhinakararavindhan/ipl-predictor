import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50',
        className
      )}
      style={{ background: 'var(--row-hover)', border: '1px solid var(--border)', ...style }}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
