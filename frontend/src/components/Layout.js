import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid, BookOpen, GitBranch, TrendingUp,
  Settings as SettingsIcon, CalendarDays
} from 'lucide-react';
import { useScreenSize } from '@/hooks/useScreenSize';

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/stewardship', icon: TrendingUp, label: 'Stewardship' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/discipleship', icon: GitBranch, label: 'Disciples' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' }
];

const SideNav = () => (
  <aside className="fixed top-0 left-0 h-full w-56 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-r border-stone-200 dark:border-stone-700 flex flex-col z-50 shadow-lg">
    <div className="flex items-center gap-3 px-5 py-6 border-b border-stone-100 dark:border-stone-800">
      <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">🐑</span>
      </div>
      <div>
        <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">Disciplesheep</p>
        <p className="text-[10px] text-stone-500 dark:text-stone-400 tracking-wide uppercase">Journal</p>
      </div>
    </div>
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
              isActive
                ? 'bg-forest-500 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
    <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800">
      <p className="text-[10px] text-stone-400 dark:text-stone-600 text-center">Church Planter&#39;s Companion</p>
    </div>
  </aside>
);

/* ── Bottom Nav ─────────────────────────────────────────────────────────── */
const BottomNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200 dark:border-stone-700 z-50"
    data-testid="bottom-navigation"
  >
    <div className="h-16 sm:h-[70px] flex items-center justify-around px-1 max-w-2xl mx-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors flex-1 max-w-[72px] sm:max-w-[90px] ${
              isActive
                ? 'text-forest-500 dark:text-forest-400'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`
          }
          data-testid={`nav-${label.toLowerCase()}`}
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] sm:text-[11px] font-medium leading-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
    <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
  </nav>
);

/* ── Journal Date Bar — shown only on /journal, sits above BottomNav ─────── */
const JournalDateBar = ({ selectedDate, onPrev, onNext, onPickerOpen }) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const day = days[selectedDate.getDay()];
  const month = months[selectedDate.getMonth()];
  const date = selectedDate.getDate().toString().padStart(2, '0');
  const year = selectedDate.getFullYear();

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200 dark:border-stone-700"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="h-14 flex items-center justify-between px-4 max-w-2xl mx-auto">
        {/* Prev */}
        <button
          onClick={onPrev}
          className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-3 text-sm font-medium"
          style={{ minHeight: 0 }}
        >
          ← Prev
        </button>

        {/* Date — clicking opens the calendar popover */}
        <button
          onClick={onPickerOpen}
          className="flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 px-3 py-1.5 rounded-xl transition-colors"
          style={{ minHeight: 0 }}
        >
          <CalendarDays className="w-4 h-4 text-forest-500 dark:text-forest-400 flex-shrink-0" />
          <div className="text-center">
            <div className="font-serif text-base font-semibold text-forest-600 dark:text-forest-400 leading-tight">
              {month} {date}, {year}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{day}</div>
          </div>
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-3 text-sm font-medium"
          style={{ minHeight: 0 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

/* ── Layout ─────────────────────────────────────────────────────────────── */
const Layout = () => {
  const { isTablet } = useScreenSize();
  const location = useLocation();
  const isJournal = location.pathname === '/journal';

  // Date state lives here so JournalDateBar and JournalEntry share it
  const [journalDate, setJournalDate] = React.useState(new Date());
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const handlePrev = () => {
    const d = new Date(journalDate);
    d.setDate(d.getDate() - 1);
    setJournalDate(d);
  };

  const handleNext = () => {
    const d = new Date(journalDate);
    d.setDate(d.getDate() + 1);
    setJournalDate(d);
  };

  // Extra bottom padding for journal page on mobile (date bar + bottom nav)
  const mobilePaddingBottom = isJournal
    ? 'calc(7.5rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(4rem + env(safe-area-inset-bottom, 0px))';

  return (
    <div className="min-h-screen bg-paper dark:bg-stone-900 transition-colors">
      {isTablet ? (
        <>
          <SideNav />
          <main className="ml-56 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
              <Outlet context={{ journalDate, setJournalDate, pickerOpen, setPickerOpen }} />
            </div>
          </main>
        </>
      ) : (
        <>
          <main style={{ paddingBottom: mobilePaddingBottom }}>
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
              <Outlet context={{ journalDate, setJournalDate, pickerOpen, setPickerOpen }} />
            </div>
          </main>

          {/* Date bar — only on journal page */}
          {isJournal && (
            <JournalDateBar
              selectedDate={journalDate}
              onPrev={handlePrev}
              onNext={handleNext}
              onPickerOpen={() => setPickerOpen(true)}
            />
          )}

          <BottomNav />
        </>
      )}
    </div>
  );
};

export default Layout;
