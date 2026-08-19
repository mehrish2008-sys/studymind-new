import { useState, type ReactNode } from 'react';
import { Menu, X, GraduationCap, MoreHorizontal, LogOut } from 'lucide-react';
import { navItems } from '@/components/nav';
import { supabase } from '@/lib/supabase';
import type { SectionId } from '@/types';

interface LayoutProps {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  children: ReactNode;
}

const primaryNavIds: SectionId[] = [
  'dashboard',
  'timetable',
  'quizzes',
  'tasks',
  'progress',
];

export function Layout({ active, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const activeLabel =
    navItems.find((n) => n.id === active)?.label ?? '';

  const handleNav = (id: SectionId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
      return;
    }

    setMobileOpen(false);
    window.location.href = '/';
  };

  const primaryItems = navItems.filter((n) =>
    primaryNavIds.includes(n.id)
  );

  const secondaryItems = navItems.filter(
    (n) => !primaryNavIds.includes(n.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex-col z-30">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <GraduationCap size={22} />
          </div>

          <div>
            <p className="font-extrabold text-gray-900 text-sm leading-tight">
              Study Prep
            </p>
            <p className="text-xs text-gray-400">
              Exam Companion
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon
                  size={18}
                  className={
                    isActive
                      ? 'text-brand-600'
                      : 'text-gray-400'
                  }
                />

                {item.label}

                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop account + sign out */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">
                Student
              </p>
              <p className="text-xs text-gray-400">
                Free Plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>

          <span className="font-extrabold text-gray-900 text-sm">
            Study Prep
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
                  <GraduationCap size={18} />
                </div>

                <span className="font-bold text-gray-900">
                  Menu
                </span>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'text-brand-600'
                          : 'text-gray-400'
                      }
                    />

                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile sign out */}
            <div className="px-3 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <LogOut size={18} />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {activeLabel}
            </h1>
          </div>

          <div key={active} className="animate-fade-in">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-400'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
              />

              <span
                className={`text-[10px] font-semibold ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] text-gray-400"
        >
          <MoreHorizontal size={20} />

          <span className="text-[10px] font-semibold text-gray-400">
            More
          </span>
        </button>
      </nav>
    </div>
  );
}