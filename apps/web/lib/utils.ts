import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNRR(nrr: number): string {
  return nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

export function getProbabilityColor(prob: number): string {
  if (prob >= 0.7) return 'text-emerald-600 dark:text-emerald-400';
  if (prob >= 0.4) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

export function getProbabilityBg(prob: number): string {
  if (prob >= 0.7) return 'bg-emerald-500/20 border-emerald-500/30';
  if (prob >= 0.4) return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export function getFormIcon(result: number): string {
  return result === 1 ? 'W' : 'L';
}

export function getFormColor(result: number): string {
  return result === 1 ? 'bg-emerald-500' : 'bg-red-500';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

export function getImportanceLabel(importance?: string): string {
  switch (importance) {
    case 'critical': return '🔥 Must-Win';
    case 'high': return '⚡ High Stakes';
    case 'medium': return '📊 Important';
    default: return '🏏 Regular';
  }
}

export function getImportanceColor(importance?: string): string {
  switch (importance) {
    case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    case 'high':     return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    case 'medium':   return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    default:         return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
  }
}
