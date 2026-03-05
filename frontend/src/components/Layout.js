import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutGrid, BookOpen, GitBranch, TrendingUp,
  Settings as SettingsIcon, Sprout
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
        <Sprout className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">Sow & Reap</p>
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

const Layout = () => {
  const { isTablet } = useScreenSize();

  return (
    <div className="min-h-screen bg-paper dark:bg-stone-900 transition-colors">
      {isTablet ? (
        <>
          <SideNav />
          <main className="ml-56 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
              <Outlet />
            </div>
          </main>
        </>
      ) : (
        <>
          <main style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
              <Outlet />
            </div>
          </main>
          <BottomNav />
        </>
      )}
    </div>
  );
};

export default Layout;
