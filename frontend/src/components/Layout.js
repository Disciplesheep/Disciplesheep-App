import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid, BookOpen, GitBranch, TrendingUp,
  CalendarDays, Settings as SettingsIcon, X, Camera, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useScreenSize } from '@/hooks/useScreenSize';
import { format, addDays, subDays, addYears } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CHURCH_PLANT_START_DATE } from '@/data/dailyDevotionals';


/* ── Safe wrapper — prevents calendar crash from blanking the whole page ── */
class CalendarErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return (
      <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400">
        Unable to load calendar. Please refresh.
      </div>
    );
    return this.props.children;
  }
}


const navItems = [
  { to: '/',             icon: LayoutGrid,   label: 'Dashboard' },
  { to: '/stewardship',  icon: TrendingUp,   label: 'Stewardship' },
  { to: '/journal',      icon: BookOpen,     label: 'Journal' },
  { to: '/calendar',     icon: CalendarDays, label: 'Calendar' },
  { to: '/discipleship', icon: GitBranch,    label: 'Disciples' },
];

const useProfile = () => {
  const [name, setName] = useState(() => localStorage.getItem('profile_name') || '');
  const [photo, setPhoto] = useState(() => localStorage.getItem('profile_photo') || '');
  const saveName = (n) => { setName(n); localStorage.setItem('profile_name', n); };
  const savePhoto = (p) => { setPhoto(p); localStorage.setItem('profile_photo', p); };
  return { name, photo, saveName, savePhoto };
};

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const navigate = useNavigate();
  const fileRef = useRef();
  const { name, photo, saveName, savePhoto } = useProfile();

  const openMenu = () => { setNameInput(name); setEditingName(false); setOpen(true); };
  const handleNameSave = () => { saveName(nameInput.trim()); setEditingName(false); };
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => savePhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const Avatar = ({ size = 36 }) => (
    photo
      ? <img src={photo} alt="profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: '#4d7c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>🐑</div>
  );

  return (
    <div className="relative">
      <button onClick={openMenu} className="rounded-full overflow-hidden shadow hover:opacity-90 transition-opacity" style={{ width: 36, height: 36 }} title="Profile & Settings">
        <Avatar size={36} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-64 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden">
            <div className="px-4 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
              <p className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">My Profile</p>
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-5 flex flex-col items-center gap-3 border-b border-stone-100 dark:border-stone-700">
              <div className="relative">
                <Avatar size={72} />
                <button onClick={() => fileRef.current.click()} className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-forest-500 flex items-center justify-center shadow hover:bg-forest-700 transition-colors" title="Change photo">
                  <Camera className="w-3 h-3 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>
              {editingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }} placeholder="Your name..." className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 outline-none focus:border-forest-500" />
                  <button onClick={handleNameSave} className="w-7 h-7 rounded-full bg-forest-500 flex items-center justify-center hover:bg-forest-700"><Check className="w-3.5 h-3.5 text-white" /></button>
                  <button onClick={() => setEditingName(false)} className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center hover:bg-stone-300"><X className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" /></button>
                </div>
              ) : (
                <button onClick={() => { setNameInput(name); setEditingName(true); }} className="text-center hover:opacity-70 transition-opacity" title="Click to edit name">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{name || 'Tap to set your name'}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Church Planter</p>
                </button>
              )}
            </div>
            <button onClick={() => { navigate('/settings'); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
              <SettingsIcon className="w-4 h-4 text-stone-400" />
              Settings
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   BOTTOM NAV — always fixed, never hides
───────────────────────────────────────────────────────────────────────── */
const BottomNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200 dark:border-stone-700"
    data-testid="bottom-navigation"
  >
    <div className="h-16 flex items-center justify-around px-1 max-w-2xl mx-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to} to={to} end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors flex-1 max-w-[60px] sm:max-w-[80px] ${
              isActive ? 'text-forest-500 dark:text-forest-400' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`
          }
          data-testid={`nav-${label.toLowerCase()}`}
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] sm:text-[10px] font-medium leading-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
    <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
  </nav>
);

/* ─────────────────────────────────────────────────────────────────────────
   JOURNAL DATE BAR
   • Sits just above the bottom nav (bottom = NAV_H)
   • Scrolling DOWN  → slides down and hides behind/under the bottom nav
   • Scrolling UP    → slides back up into view
   • Clicking date   → shows calendar popup above the date bar
   • Bottom nav is untouched and always visible
───────────────────────────────────────────────────────────────────────── */
const NAV_H  = 64;   // bottom nav height (h-16)
const BAR_H  = 42;   // date bar height

const JournalDateBar = ({ journalDate, setJournalDate, pickerOpen, setPickerOpen }) => {
  const [barVisible, setBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking    = useRef(false);

  const startDate       = CHURCH_PLANT_START_DATE instanceof Date ? CHURCH_PLANT_START_DATE : new Date(CHURCH_PLANT_START_DATE);
  const ministryEndDate = addYears(startDate, 6);
  const isToday         = format(journalDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  /* scroll listener — only hides the date bar, never the nav */
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < lastScrollY.current || y <= 10) setBarVisible(true);
        else if (y > lastScrollY.current && y > 60) setBarVisible(false);
        lastScrollY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* always show bar when picker is open */
  useEffect(() => { if (pickerOpen) setBarVisible(true); }, [pickerOpen]);

  /*
    barBottom: how far from the bottom of the viewport the bar sits.
    When visible  → sits on top of the bottom nav: NAV_H px from bottom
    When hidden   → slides down by BAR_H so it's tucked under the nav
  */
  const barBottom = barVisible
    ? `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))`
    : `calc(${NAV_H - BAR_H}px + env(safe-area-inset-bottom, 0px))`;

  /*
    Calendar panel bottom = just above the date bar
  */
  const calBottom = `calc(${NAV_H + BAR_H}px + env(safe-area-inset-bottom, 0px) + 0.25rem)`;

  return (
    <>
      {/* ── Calendar popup — only when pickerOpen ── */}
      {pickerOpen && (
        <>
          {/* tap-outside backdrop */}
          <div className="fixed inset-0 z-[55]" onClick={() => setPickerOpen(false)} />

          {/* calendar panel */}
          <div
            className="fixed z-[60] left-2 right-2 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700"
            style={{ bottom: calBottom }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="font-serif font-semibold text-stone-800 dark:text-stone-100 text-sm">Select a Date</p>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full">
              <CalendarErrorBoundary>
              <CalendarComponent
                mode="single"
                selected={journalDate}
                onSelect={(d) => { if (d) { setJournalDate(d); setPickerOpen(false); } }}
                defaultMonth={journalDate}
              />
              </CalendarErrorBoundary>
            </div>

            <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 rounded-b-2xl">
              <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center">
                6-Year Journal · {format(startDate, 'MMM yyyy')} – {format(ministryEndDate, 'MMM yyyy')}
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Date bar strip ── */}
      <div
        className="fixed left-0 right-0 z-[45] transition-all duration-300"
        style={{ bottom: barBottom }}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-forest-500 text-white">
          <button onClick={() => setJournalDate(d => subDays(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" style={{ minHeight: 0 }}>
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button onClick={() => setPickerOpen(v => !v)} className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/20 transition-colors" style={{ minHeight: 0 }}>
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {isToday ? 'Today · ' : ''}{format(journalDate, 'MMM d, yyyy')}
            </span>
          </button>

          <button onClick={() => setJournalDate(d => addDays(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" style={{ minHeight: 0 }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   SIDE NAV (tablet)
───────────────────────────────────────────────────────────────────────── */
const SideNav = () => (
  <aside className="fixed top-0 left-0 h-full w-56 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-r border-stone-200 dark:border-stone-700 flex flex-col z-50 shadow-lg">
    <div className="flex items-center justify-between px-5 py-6 border-b border-stone-100 dark:border-stone-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center flex-shrink-0"><span className="text-xl">🐑</span></div>
        <div>
          <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">Disciplesheep</p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 tracking-wide uppercase">Journal</p>
        </div>
      </div>
      <ProfileMenu />
    </div>
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
              isActive ? 'bg-forest-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`
          }
        >
          {({ isActive }) => (
            <><Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} /><span>{label}</span></>
          )}
        </NavLink>
      ))}
    </nav>
    <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800">
      <p className="text-[10px] text-stone-400 dark:text-stone-600 text-center">Church Planter&#39;s Companion</p>
    </div>
  </aside>
);

/* ─────────────────────────────────────────────────────────────────────────
   LAYOUT
───────────────────────────────────────────────────────────────────────── */
const Layout = () => {
  const { isTablet } = useScreenSize();
  const location     = useLocation();
  const isJournalPage = location.pathname === '/journal';

  const [journalDate, setJournalDate] = useState(new Date());
  const [pickerOpen,  setPickerOpen]  = useState(false);

  const outletContext = { journalDate, setJournalDate, pickerOpen, setPickerOpen };

  return (
    <div className="min-h-screen bg-paper dark:bg-stone-900 transition-colors">
      {isTablet ? (
        <>
          <SideNav />
          <main className="ml-56 min-h-screen">
            {isJournalPage && (
              <div className="sticky top-0 z-40">
                <JournalDateBar
                  journalDate={journalDate}
                  setJournalDate={setJournalDate}
                  pickerOpen={pickerOpen}
                  setPickerOpen={setPickerOpen}
                />
              </div>
            )}
            <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
              <Outlet context={outletContext} />
            </div>
          </main>
        </>
      ) : (
        <>
          {/* Mobile top header */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between px-4 h-12">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐑</span>
                <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">Disciplesheep</p>
              </div>
              <ProfileMenu />
            </div>
          </div>

          {/* Page content
              paddingTop  = top header (48px)
              paddingBottom = bottom nav (64px) + date bar (42px on journal) + safe area + extra breathing room
          */}
          <main style={{
            paddingTop: '3rem',
            paddingBottom: isJournalPage
              ? `calc(${NAV_H + BAR_H}px + env(safe-area-inset-bottom, 0px) + 1rem)`
              : `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px) + 1rem)`,
          }}>
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
              <Outlet context={outletContext} />
            </div>
          </main>

          {/* Bottom nav — always visible */}
          <BottomNav />

          {/* Journal date bar — only on journal page */}
          {isJournalPage && (
            <JournalDateBar
              journalDate={journalDate}
              setJournalDate={setJournalDate}
              pickerOpen={pickerOpen}
              setPickerOpen={setPickerOpen}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Layout;