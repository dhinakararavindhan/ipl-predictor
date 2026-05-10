import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent',
  ghost:   'bg-transparent text-muted border-transparent',
  outline: 'bg-transparent text-primary border-theme',
  danger:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
