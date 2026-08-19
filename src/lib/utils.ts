import type { SubjectColor } from '@/types';

export const colorClasses: Record<
  SubjectColor,
  { bg: string; text: string; border: string; gradient: string; soft: string; ring: string }
> = {
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    soft: 'bg-blue-50',
    ring: 'ring-blue-200',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-500',
    gradient: 'from-green-500 to-green-600',
    soft: 'bg-green-50',
    ring: 'ring-green-200',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    soft: 'bg-purple-50',
    ring: 'ring-purple-200',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-500',
    gradient: 'from-orange-500 to-orange-600',
    soft: 'bg-orange-50',
    ring: 'ring-orange-200',
  },
  pink: {
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    border: 'border-pink-500',
    gradient: 'from-pink-500 to-pink-600',
    soft: 'bg-pink-50',
    ring: 'ring-pink-200',
  },
  teal: {
    bg: 'bg-teal-500',
    text: 'text-teal-600',
    border: 'border-teal-500',
    gradient: 'from-teal-500 to-teal-600',
    soft: 'bg-teal-50',
    ring: 'ring-teal-200',
  },
  indigo: {
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600',
    soft: 'bg-indigo-50',
    ring: 'ring-indigo-200',
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-500',
    gradient: 'from-red-500 to-red-600',
    soft: 'bg-red-50',
    ring: 'ring-red-200',
  },
};

export function getSubjectColor(color: SubjectColor) {
  return colorClasses[color];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isToday(dateStr: string): boolean {
  return daysUntil(dateStr) === 0;
}

export function isOverdue(dateStr: string): boolean {
  return daysUntil(dateStr) < 0;
}

export function isThisWeek(dateStr: string): boolean {
  const days = daysUntil(dateStr);
  return days >= 0 && days <= 7;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const priorityConfig = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high: { label: 'High', className: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
} as const;

export const taskTypeConfig = {
  homework: 'Homework',
  assignment: 'Assignment',
  reading: 'Reading',
  project: 'Project',
  other: 'Other',
} as const;

export const difficultyConfig = {
  easy: { label: 'Easy', className: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  hard: { label: 'Hard', className: 'bg-red-100 text-red-700' },
} as const;

export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
