import { useApp } from '@/store';
import type { SectionId } from '@/types';
import { getSubjectColor, getGreeting, formatDate, daysUntil, formatTimeRange, priorityConfig } from '@/lib/utils';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import * as Icons from 'lucide-react';
import { Clock, Calendar, TrendingUp, CheckCircle2, ArrowRight, Flame, Target, CheckSquare, HelpCircle, BookOpen, GraduationCap } from 'lucide-react';

interface DashboardProps {
  onNavigate: (id: SectionId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { subjects, studySessions, tasks, exams, quizAttempts } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = studySessions.filter((s) => s.date === today);
  const upcomingTasks = tasks.filter((t) => !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  const upcomingExams = exams.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));

  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
  const completedTopics = subjects.reduce((sum, s) => sum + s.topics.filter((t) => t.completed).length, 0);
  const topicProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const completedSessions = studySessions.filter((s) => s.completed).length;
  const sessionRate = studySessions.length > 0 ? Math.round((completedSessions / studySessions.length) * 100) : 0;

  const avgQuizScore =
    quizAttempts.length > 0
      ? Math.round((quizAttempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / quizAttempts.length) * 10) / 10
      : 0;

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  // Progress ring
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (topicProgress / 100) * circumference;

  return (
    <div className="space-y-5 lg:mt-0">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-6 py-7 sm:px-8 sm:py-8 text-white shadow-xl shadow-brand-500/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-16 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1.5">{getGreeting()}!</h1>
            <p className="text-white/80 mt-2 text-sm leading-relaxed">
              {todaySessions.length > 0
                ? `You have ${todaySessions.length} study session${todaySessions.length > 1 ? 's' : ''} scheduled for today.`
                : 'No study sessions today. Enjoy your break or add one!'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/15 text-white hover:bg-white/25 border-0 backdrop-blur-sm"
                icon={<Calendar size={14} />}
                onClick={() => onNavigate('timetable')}
              >
                View Schedule
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/15 text-white hover:bg-white/25 border-0 backdrop-blur-sm"
                icon={<HelpCircle size={14} />}
                onClick={() => onNavigate('quizzes')}
              >
                Take a Quiz
              </Button>
            </div>
          </div>
          {/* Progress ring */}
          <div className="flex-shrink-0 hidden sm:flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="36" fill="none" stroke="white" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white">{topicProgress}%</span>
                <span className="text-[10px] text-white/70 font-medium">done</span>
              </div>
            </div>
            <span className="text-xs text-white/70 font-medium mt-1.5">Overall</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Target size={18} />} label="Topics Done" value={`${completedTopics}/${totalTopics}`} sub={`${topicProgress}% complete`} color="text-brand-600" bg="bg-brand-50" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Sessions" value={`${completedSessions}`} sub={`${sessionRate}% done`} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={<TrendingUp size={18} />} label="Quiz Average" value={`${avgQuizScore}%`} sub={`${quizAttempts.length} attempts`} color="text-accent-600" bg="bg-accent-50" />
        <StatCard icon={<Flame size={18} />} label="Exams Left" value={`${upcomingExams.length}`} sub={upcomingExams[0] ? `Next in ${daysUntil(upcomingExams[0].date)}d` : 'None'} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Today's sessions */}
      <Card>
        <SectionHeader icon={<Clock size={18} />} title="Today's Sessions" onNavigate={onNavigate} navTarget="timetable" />
        {todaySessions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 mb-3">No sessions scheduled for today.</p>
            <Button size="sm" variant="outline" icon={<Calendar size={14} />} onClick={() => onNavigate('timetable')}>
              Add a Session
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((session) => {
              const subject = getSubject(session.subjectId);
              if (!subject) return null;
              const colors = getSubjectColor(subject.color);
              const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;
              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${session.completed ? 'bg-gray-50 border-gray-100 opacity-60' : `${colors.soft} border-transparent`}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold text-gray-900 ${session.completed ? 'line-through' : ''}`}>{session.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      {subject.name}
                      <span className="text-gray-300">•</span>
                      <Clock size={10} />
                      {formatTimeRange(session.startTime, session.endTime)}
                    </p>
                  </div>
                  {session.completed ? (
                    <Badge className="bg-green-100 text-green-700">Done</Badge>
                  ) : (
                    <Badge className="bg-white text-gray-600 shadow-sm">Upcoming</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming tasks */}
        <Card>
          <SectionHeader icon={<CheckSquare size={18} />} title="Upcoming Tasks" onNavigate={onNavigate} navTarget="tasks" />
          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No pending tasks. You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const subject = task.subjectId ? getSubject(task.subjectId) : null;
                const days = daysUntil(task.dueDate);
                const overdue = days < 0;
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className={`w-2 h-2 rounded-full ${priorityConfig[task.priority].dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{subject?.name ?? 'General'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${overdue ? 'text-red-600' : days <= 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Exam countdowns */}
        <Card>
          <SectionHeader icon={<GraduationCap size={18} />} title="Exam Countdown" onNavigate={onNavigate} navTarget="exams" />
          {upcomingExams.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No upcoming exams.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 3).map((exam) => {
                const subject = getSubject(exam.subjectId);
                if (!subject) return null;
                const colors = getSubjectColor(subject.color);
                const days = daysUntil(exam.date);
                return (
                  <div key={exam.id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100">
                    <div className={`w-12 h-12 rounded-xl ${colors.soft} flex flex-col items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-extrabold ${colors.text}`}>{days}</span>
                      <span className="text-[10px] text-gray-500 font-medium">days</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{exam.title}</p>
                      <p className="text-xs text-gray-500">{subject.name} • {formatDate(exam.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction icon={<Calendar size={20} />} label="Add Session" onClick={() => onNavigate('timetable')} />
          <QuickAction icon={<CheckSquare size={20} />} label="Add Task" onClick={() => onNavigate('tasks')} />
          <QuickAction icon={<HelpCircle size={20} />} label="Take Quiz" onClick={() => onNavigate('quizzes')} />
          <QuickAction icon={<BookOpen size={20} />} label="Revise" onClick={() => onNavigate('revision')} />
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({ icon, title, onNavigate, navTarget }: { icon: React.ReactNode; title: string; onNavigate: (id: SectionId) => void; navTarget: SectionId }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-brand-600">{icon}</span>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <button onClick={() => onNavigate(navTarget)} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
        View all <ArrowRight size={14} />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color} mb-2.5`}>
        {icon}
      </div>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 transition-all duration-200 group active:scale-95"
    >
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-500 group-hover:text-brand-600 transition-colors shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-600 group-hover:text-brand-700">{label}</span>
    </button>
  );
}
