import { type SectionId } from '@/types';
import { LayoutDashboard, CalendarDays, BookCopy, StickyNote, HelpCircle, CheckSquare, GraduationCap, TrendingUp, Bookmark, Bot } from 'lucide-react';

export interface NavItem { id: SectionId; label: string; icon: typeof LayoutDashboard; }

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects', icon: BookCopy },
  { id: 'revision', label: 'Revision', icon: StickyNote },
  { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'ai', label: 'AI Study Helper', icon: Bot },
  { id: 'plans', label: 'Premium Plans', icon: GraduationCap },
];
