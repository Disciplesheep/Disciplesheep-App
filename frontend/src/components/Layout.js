import React, { useState, useRef, useEffect, useCallback } from 'react';
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

/* ── Constants outside component — no re-creation on render ─────────────── */
const NAV_H      = 64;
const BAR_H      = 42;
const ROOT_PAGES = ['/', '/stewardship', '/journal', '/calendar', '/discipleship'];

/* ── FIX: moved outside Layout so it's stable (no missing-deps warning) ─── */
const CUSTOM_BACK = {
  '/stewardship/people':   '/stewardship',
  '/stewardship/expenses': '/stewardship',
  '/stewardship/reports':  '/stewardship',
};

/* ── Auto-export — pure function, no closure deps ───────────────────────── */
const triggerAutoExport = () => {
  const DATA_KEYS = ['dailyEntries','peopleContacts','expenses','weeklyReports','monthlyReports','calendarEvents'];
  const backup = { _version: 1, _exportedAt: new Date().toISOString() };
  DATA_KEYS.forEach(key => {
    try { const r = localStorage.getItem(key); backup[key] = r ? JSON.parse(r) : null; }
    catch { backup[key] = null; }
  });
  backup._profile = {
    name:  localStorage.getItem('profile_name')  || '',
    photo: localStorage.getItem('profile_photo') || '',
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `disciplesheep-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Shared Avatar ───────────────────────────────────────────────────────── */
const Avatar = ({ size = 36 }) => {
  const photo = localStorage.getItem('profile_photo') || '';
  return photo
    ? <img src={photo} alt="profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#4d7c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>🐑</div>;
};

/* ── Calendar error boundary ─────────────────────────────────────────────── */
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

/* ── Nav items ───────────────────────────────────────────────────────────── */
const navItems = [
  { to: '/',             icon: LayoutGrid,   label: 'Dashboard' },
  { to: '/stewardship',  icon: TrendingUp,   label: 'Stewardship' },
  { to: '/journal',      icon: BookOpen,     label: 'Journal' },
  { to: '/calendar',     icon: CalendarDays, label: 'Calendar' },
  { to: '/discipleship', icon: GitBranch,    label: 'Disciples' },
];

/* ── Profile hook ────────────────────────────────────────────────────────── */
const useProfile = () => {
  const [name,  setName]  = useState(() => localStorage.getItem('profile_name')  || '');
  const [photo, setPhoto] = useState(() => localStorage.getItem('profile_photo') || '');
  const saveName  = (n) => { setName(n);  localStorage.setItem('profile_name',  n); };
  const savePhoto = (p) => { setPhoto(p); localStorage.setItem('profile_photo', p); };
  return { name, photo, saveName, savePhoto };
};

/* ── Shared avatar editor ────────────────────────────────────────────────── */
const AvatarEditor = ({ size, fileRef, onPhotoChange }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <Avatar size={size} />
    <button
      onClick={() => fileRef.current.click()}
      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-forest-500 flex items-center justify-center shadow-lg hover:bg-forest-700 transition-colors"
      title="Change photo"
    >
      <Camera className="w-4 h-4 text-white" />
    </button>
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
  </div>
);

/* ── Profile Modal (mobile) ──────────────────────────────────────────────── */
const ProfileModal = ({ open, onClose }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState('');
  const navigate = useNavigate();
  const fileRef  = useRef();
  const { name, saveName, savePhoto } = useProfile();

  useEffect(() => {
    if (!open) return;
    window.__dialogOpenCount = (window.__dialogOpenCount || 0) + 1;
    window.history.pushState({ profileModal: true }, '');
    const onPop = () => { if (document.activeElement) document.activeElement.blur(); setTimeout(onClose, 50); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.__dialogOpenCount = Math.max(0, (window.__dialogOpenCount || 1) - 1);
    };
  }, [open, onClose]);

  const handleNameSave = () => { saveName(nameInput.trim()); setEditingName(false); };
  const handlePhoto    = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => savePhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <p className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">My Profile</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 px-6 py-6">
          <AvatarEditor size={96} fileRef={fileRef} onPhotoChange={handlePhoto} />
          {editingName ? (
            <div className="flex items-center gap-2 w-full">
              <input autoFocus value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                placeholder="Your name..."
                className="flex-1 text-base px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 outline-none focus:border-forest-500"
              />
              <button onClick={handleNameSave} className="w-9 h-9 rounded-full bg-forest-500 flex items-center justify-center hover:bg-forest-700">
                <Check className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setEditingName(false)} className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center hover:bg-stone-300">
                <X className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setNameInput(name); setEditingName(true); }} className="text-center hover:opacity-70 transition-opacity" title="Tap to edit name">
              <p className="font-semibold text-stone-900 dark:text-stone-100 text-lg">{name || 'Tap to set your name'}</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">Church Planter · tap to edit</p>
            </button>
          )}
        </div>
        <div className="border-t border-stone-100 dark:border-stone-700">
          <button onClick={() => { navigate('/settings'); onClose(); }}
            className="w-full flex items-center gap-3 px-6 py-4 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            <SettingsIcon className="w-5 h-5 text-stone-400" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Profile Menu (tablet dropdown) ─────────────────────────────────────── */
const ProfileMenu = () => {
  const [open,        setOpen]        = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState('');
  const navigate = useNavigate();
  const fileRef  = useRef();
  const { name, saveName, savePhoto } = useProfile();

  const openMenu       = () => { setNameInput(name); setEditingName(false); setOpen(true); };
  const handleNameSave = () => { saveName(nameInput.trim()); setEditingName(false); };
  const handlePhoto    = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => savePhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

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
              <AvatarEditor size={72} fileRef={fileRef} onPhotoChange={handlePhoto} />
              {editingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                    placeholder="Your name..."
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 outline-none focus:border-forest-500" />
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
            <button onClick={() => { navigate('/settings'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
              <SettingsIcon className="w-4 h-4 text-stone-400" />
              Settings
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Bottom Nav ──────────────────────────────────────────────────────────── */
const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200 dark:border-stone-700" data-testid="bottom-navigation">
    <div className="h-16 flex items-center justify-around px-1 max-w-2xl mx-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
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

/* ── Journal Date Bar ────────────────────────────────────────────────────── */
const JournalDateBar = ({ journalDate, setJournalDate, pickerOpen, setPickerOpen }) => {
  const [barVisible, setBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking     = useRef(false);

  const startDate       = CHURCH_PLANT_START_DATE instanceof Date ? CHURCH_PLANT_START_DATE : new Date(CHURCH_PLANT_START_DATE);
  const ministryEndDate = addYears(startDate, 6);
  const isToday         = format(journalDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

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

  useEffect(() => { if (pickerOpen) setBarVisible(true); }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onScroll = () => setPickerOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pickerOpen, setPickerOpen]);

  const barBottom = barVisible
    ? `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))`
    : `calc(${NAV_H - BAR_H}px + env(safe-area-inset-bottom, 0px))`;
  const calBottom = `calc(${NAV_H + BAR_H}px + env(safe-area-inset-bottom, 0px) + 0.25rem)`;

  return (
    <>
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setPickerOpen(false)} />
          <div className="fixed z-[60] left-2 right-2 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700" style={{ bottom: calBottom }}>
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="font-serif font-semibold text-stone-800 dark:text-stone-100 text-sm">Select a Date</p>
              <button onClick={() => setPickerOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full">
              <CalendarErrorBoundary>
                <CalendarComponent mode="single" selected={journalDate}
                  onSelect={(d) => { if (d) { setJournalDate(d); setPickerOpen(false); } }}
                  defaultMonth={journalDate} />
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
      <div className="fixed left-0 right-0 z-[45] transition-all duration-300" style={{ bottom: barBottom }}>
        <div className="flex items-center justify-between px-4 py-2 bg-forest-500 text-white">
          <button onClick={() => setJournalDate(d => subDays(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" style={{ minHeight: 0 }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setPickerOpen(v => !v)} className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/20 transition-colors" style={{ minHeight: 0 }}>
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {isToday ? 'Today · ' : ''}{format(journalDate, 'MMM d, yyyy')} ({format(journalDate, 'EEE')})
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

/* ── Side Nav (tablet) ───────────────────────────────────────────────────── */
const SideNav = () => {
  const navigate = useNavigate();
  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-r border-stone-200 dark:border-stone-700 flex flex-col z-50 shadow-lg">
      <div className="flex items-center justify-between px-5 py-6 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          {/* ↓ clickable sheep — navigates to Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center flex-shrink-0 hover:bg-forest-700 active:scale-95 transition-all"
            title="Settings"
          >
            <span className="text-xl">🐑</span>
          </button>
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
};

if (typeof window.__dialogOpenCount === 'undefined') window.__dialogOpenCount = 0;

/* ── Layout ──────────────────────────────────────────────────────────────── */
const Layout = () => {
  const { isTablet }  = useScreenSize();
  const location      = useLocation();
  const navigate      = useNavigate();
  const isJournalPage = location.pathname === '/journal';

  // CUSTOM_BACK is now defined at module level (no missing-deps warning)

  const [journalDate,  setJournalDate]  = useState(new Date());
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [exitToastMsg, setExitToastMsg] = useState('');

  const exitStepRef  = useRef(0);
  const exitTimerRef = useRef(null);

  const outletContext = { journalDate, setJournalDate, pickerOpen, setPickerOpen };

  // ── Two-tap dismiss: tap 1 = blur keyboard, tap 2 = close dialog ─────────
  useEffect(() => {
    let justDismissedKeyboard = false;
    const onPointerDown = (e) => {
      const active = document.activeElement;
      if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) return;
      if (e.target.closest('button, input, textarea, select, a, label, [role="button"], [role="option"], [role="combobox"]')) return;
      active.blur();
      justDismissedKeyboard = true;
      setTimeout(() => { justDismissedKeyboard = false; }, 400);
    };
    const onClickCapture = (e) => {
      if (!justDismissedKeyboard) return;
      justDismissedKeyboard = false;
      e.stopImmediatePropagation();
    };
    document.addEventListener('pointerdown', onPointerDown, { capture: true });
    document.addEventListener('click', onClickCapture, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      document.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, []);

  // ── Sentinel push on root page entry ─────────────────────────────────────
  const resetExitStep = useCallback(() => {
    exitStepRef.current = 0;
    setExitToastMsg('');
  }, []);

  useEffect(() => {
    if (ROOT_PAGES.includes(location.pathname)) {
      window.history.pushState({ appEntry: true }, '');
    } else {
      resetExitStep();
    }
  }, [location.pathname, resetExitStep]);

  // ── Back-button handler ───────────────────────────────────────────────────
  useEffect(() => {
    const onPopState = (e) => {
      if (e.state?.pdfOpen) return;
      if (window.__dialogOpenCount > 0) return;

      // Custom back destinations for sub-pages (CUSTOM_BACK is module-level)
      const customDest = CUSTOM_BACK[window.location.pathname];
      if (customDest) { navigate(customDest); return; }

      if (!ROOT_PAGES.includes(window.location.pathname)) return;

      window.history.pushState({ appEntry: true }, '');
      clearTimeout(exitTimerRef.current);

      const step = exitStepRef.current;
      if (step === 0) {
        exitStepRef.current = 1;
        triggerAutoExport();
        setExitToastMsg('✅ Backup saved! Press back again to exit');
        exitTimerRef.current = setTimeout(resetExitStep, 4000);
      } else if (step === 1) {
        exitStepRef.current = 2;
        setExitToastMsg('Press back once more to exit');
        exitTimerRef.current = setTimeout(resetExitStep, 3000);
      } else {
        resetExitStep();
        if (window.navigator.app) window.navigator.app.exitApp();
        else window.close();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => { window.removeEventListener('popstate', onPopState); clearTimeout(exitTimerRef.current); };
    // FIX: navigate is now included; CUSTOM_BACK is stable (module-level const)
  }, [navigate, resetExitStep]);

  const toastBottom = isJournalPage
    ? `calc(${NAV_H + BAR_H + 12}px + env(safe-area-inset-bottom, 0px))`
    : `calc(${NAV_H + 12}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <div className="min-h-screen bg-paper dark:bg-stone-900 transition-colors">

      {exitToastMsg && (
        <div className="fixed left-1/2 z-[200] px-5 py-2.5 rounded-full bg-stone-900/90 dark:bg-stone-100/90 text-white dark:text-stone-900 text-sm font-medium shadow-xl backdrop-blur-sm"
          style={{ bottom: toastBottom, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          {exitToastMsg}
        </div>
      )}

      {isTablet ? (
        <>
          <SideNav />
          <main className="ml-56 min-h-screen">
            {isJournalPage && (
              <div className="sticky top-0 z-40">
                <JournalDateBar journalDate={journalDate} setJournalDate={setJournalDate} pickerOpen={pickerOpen} setPickerOpen={setPickerOpen} />
              </div>
            )}
            <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
              <Outlet context={outletContext} />
            </div>
          </main>
        </>
      ) : (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center px-4 h-12">
              {/* ↓ sheep + title — opens Profile modal (which has Settings link) */}
              <button onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2 min-w-0 hover:opacity-70 active:scale-95 transition-all"
                title="My Profile">
                <span className="text-lg shrink-0">🐑</span>
                <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 shrink-0">Disciplesheep</p>
                <div className="w-px h-6 bg-stone-300 dark:bg-stone-600 shrink-0 mx-1" />
                <div className="min-w-0 text-left">
                  <p className="text-xs italic text-stone-700 dark:text-stone-300 leading-tight">"The Lord is my Shepherd,</p>
                  <p className="text-xs italic text-stone-700 dark:text-stone-300 leading-tight">that's all I want!"</p>
                </div>
              </button>
            </div>
          </div>

          <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

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

          <BottomNav />

          {isJournalPage && (
            <JournalDateBar journalDate={journalDate} setJournalDate={setJournalDate} pickerOpen={pickerOpen} setPickerOpen={setPickerOpen} />
          )}
        </>
      )}
    </div>
  );
};

export default Layout;