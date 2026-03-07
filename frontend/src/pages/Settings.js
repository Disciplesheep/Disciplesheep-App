import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sunrise, Type, Settings as SettingsIcon, Lock, ShieldCheck, ShieldOff, Eye, EyeOff, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useProfilePassword } from '@/hooks/useProfilePassword';

// ── Segmented Toggle ──────────────────────────────────────────────────────────
const SegmentedToggle = ({ options, value, onChange, name }) => {
  const selectedIndex = options.findIndex(o => o.value === value);
  const pct = 100 / options.length;
  return (
    <div role="radiogroup" aria-label={name} style={{ position:'relative', display:'flex', width:'100%', borderRadius:'0.75rem', padding:'4px', gap:'2px', background:'var(--seg-bg)' }}>
      <span aria-hidden="true" style={{ position:'absolute', top:4, bottom:4, borderRadius:'0.6rem', width:`calc(${pct}% - 6px)`, left:`calc(${selectedIndex*pct}% + 4px)`, background:'var(--seg-pill)', boxShadow:'0 2px 8px rgba(0,0,0,0.13), 0 1px 2px rgba(0,0,0,0.08)', transition:'left 0.32s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents:'none' }} />
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} role="radio" aria-checked={active} onClick={() => onChange(opt.value)}
            style={{ position:'relative', zIndex:1, flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px 6px', borderRadius:'0.55rem', border:'none', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight:active?600:500, fontFamily:'inherit', color:active?'var(--seg-active-text)':'var(--seg-inactive-text)', transition:'color 0.2s', minHeight:0, userSelect:'none', WebkitUserSelect:'none' }}>
            {opt.icon && <span style={{ display:'flex', transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform:active?'scale(1.15)':'scale(1)' }}>{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ── Font Preview ──────────────────────────────────────────────────────────────
const FontPreview = ({ fontSize }) => {
  const config = {
    small:  { labelSize:'13px', bodySize:'15px', note:'Easy reading — ideal for longer sessions' },
    medium: { labelSize:'14px', bodySize:'17px', note:'Comfortable large — great for daily use' },
    large:  { labelSize:'15px', bodySize:'19px', note:'Maximum size — easiest on the eyes' },
    xlarge: { labelSize:'16px', bodySize:'21px', note:'Extra large — for maximum comfort' },
  };
  const c = config[fontSize] || config.small;
  return (
    <div style={{ marginTop:'10px', padding:'12px 14px', borderRadius:'0.65rem', background:'var(--preview-bg)', border:'1px solid var(--preview-border)', transition:'all 0.2s ease' }}>
      <p style={{ fontFamily:"'Playfair Display', serif", fontSize:c.bodySize, lineHeight:1.6, color:'var(--preview-text)', margin:0, transition:'font-size 0.2s ease' }}>
        "The harvest is plentiful, but the workers are few."
      </p>
      <p style={{ fontSize:c.labelSize, color:'var(--preview-muted)', margin:'6px 0 0', fontStyle:'italic', transition:'font-size 0.2s ease' }}>{c.note}</p>
    </div>
  );
};

// ── Password Field helper ─────────────────────────────────────────────────────
const PwField = ({ label, value, onChange, show, onToggle, onEnter, autoFocus, isCorrect }) => (
  <div className="space-y-1">
    <label className="text-xs text-stone-500 dark:text-stone-400">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        autoFocus={autoFocus}
        autoComplete="new-password"
        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100 outline-none transition-colors ${
          isCorrect
            ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20'
            : 'border-stone-200 dark:border-stone-600 focus:border-forest-500'
        }`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isCorrect && <span className="text-forest-500 text-xs font-bold">✓</span>}
        <button type="button" onClick={onToggle} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  </div>
);

// ── Security Card ─────────────────────────────────────────────────────────────
const SecurityCard = () => {
  const { hasPassword, setPassword, verifyPassword, removePassword } = useProfilePassword();
  const [mode, setMode]       = useState(null);
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const currentIsCorrect = (mode === 'change' || mode === 'remove') && current.length > 0 && verifyPassword(current);

  useEffect(() => {
    if (!currentIsCorrect) return;
    if (mode === 'remove') {
      const timer = setTimeout(() => {
        removePassword();
        setSuccess('Password removed. Deletions are unprotected.');
        reset();
      }, 400);
      return () => clearTimeout(timer);
    }
    if (mode === 'change') {
      const nextInput = document.querySelector('input[data-field="new-password"]');
      if (nextInput) setTimeout(() => nextInput.focus(), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIsCorrect]);

  const reset = () => { setMode(null); setCurrent(''); setNext(''); setConfirm(''); setError(''); setSuccess(''); };

  const handleSubmit = () => {
    setError('');
    if (mode === 'set') {
      if (next.trim().length < 4) return setError('Password must be at least 4 characters.');
      if (next !== confirm)        return setError('Passwords do not match.');
      setPassword(next.trim());
      setSuccess('Password set. Deletions are now protected.');
      reset();
    } else if (mode === 'change') {
      if (!verifyPassword(current))    return setError('Current password is incorrect.');
      if (next.trim().length < 4)      return setError('New password must be at least 4 characters.');
      if (next !== confirm)            return setError('New passwords do not match.');
      setPassword(next.trim());
      setSuccess('Password updated successfully.');
      reset();
    } else if (mode === 'remove') {
      if (!verifyPassword(current)) return setError('Incorrect password.');
      removePassword();
      setSuccess('Password removed. Deletions are unprotected.');
      reset();
    }
  };

  return (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="security-card">
      <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-5">Security</h2>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${hasPassword ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-stone-100 dark:bg-stone-700'}`}>
          <Lock className={`w-4 h-4 ${hasPassword ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Delete Guard</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {hasPassword ? 'Password required before any record can be deleted.' : 'No password set — deletions require no confirmation.'}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${hasPassword ? 'bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
          {hasPassword ? <><ShieldCheck className="w-3 h-3" /> Protected</> : <><ShieldOff className="w-3 h-3" /> Off</>}
        </span>
      </div>
      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {!hasPassword && (
            <button onClick={() => setMode('set')} className="px-4 py-2 text-sm rounded-xl bg-forest-500 hover:bg-forest-600 text-white transition-colors">
              Set Password
            </button>
          )}
          {hasPassword && (
            <>
              <button onClick={() => setMode('change')} className="px-4 py-2 text-sm rounded-xl bg-forest-500 hover:bg-forest-600 text-white transition-colors">
                Change Password
              </button>
              <button onClick={() => setMode('remove')} className="px-4 py-2 text-sm rounded-xl border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Remove Password
              </button>
            </>
          )}
        </div>
      )}
      {mode !== null && (
        <div className="space-y-3">
          {(mode === 'change' || mode === 'remove') && (
            <PwField
              label={mode === 'remove' ? 'Enter password to confirm removal' : 'Current password'}
              value={current}
              onChange={e => { setCurrent(e.target.value); setError(''); }}
              show={showPw} onToggle={() => setShowPw(v => !v)}
              autoFocus isCorrect={currentIsCorrect}
            />
          )}
          {(mode === 'set' || mode === 'change') && (
            <>
              <PwField
                label={mode === 'change' ? 'New password' : 'Password (min 4 characters)'}
                value={next}
                onChange={e => { setNext(e.target.value); setError(''); }}
                show={showPw} onToggle={() => setShowPw(v => !v)}
                autoFocus={mode === 'set'} data-field="new-password"
              />
              <PwField
                label="Confirm password" value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                show={showPw} onToggle={() => setShowPw(v => !v)}
                onEnter={handleSubmit}
              />
            </>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {(mode === 'change' || mode === 'remove') && !currentIsCorrect && current.length > 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {mode === 'remove' ? 'Enter the correct password to auto-confirm removal.' : 'Enter the correct password to continue.'}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={reset} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
              Cancel
            </button>
            {mode !== 'remove' && (
              <button onClick={handleSubmit} className="flex-1 h-10 rounded-xl text-white text-sm bg-forest-500 hover:bg-forest-600 transition-colors">
                {mode === 'set' ? 'Save' : 'Update'}
              </button>
            )}
          </div>
        </div>
      )}
      {success && <p className="text-xs text-forest-600 dark:text-forest-400 font-medium mt-3">{success}</p>}
    </Card>
  );
};

// ── Data Backup Card ──────────────────────────────────────────────────────────
const DATA_KEYS = [
  'dailyEntries', 'peopleContacts', 'expenses',
  'weeklyReports', 'monthlyReports', 'calendarEvents',
];

const DataBackupCard = () => {
  const importRef = useRef();
  const [importStatus, setImportStatus] = useState(null); // 'success' | 'error' | null
  const [importMsg,    setImportMsg]    = useState('');
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [pendingData,  setPendingData]  = useState(null);

  // ── Export ──
  const handleExport = () => {
    const backup = { _version: 1, _exportedAt: new Date().toISOString() };
    DATA_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        backup[key] = raw ? JSON.parse(raw) : null;
      } catch {
        backup[key] = null;
      }
    });
    // Also include profile
    backup._profile = {
      name:  localStorage.getItem('profile_name')  || '',
      photo: localStorage.getItem('profile_photo') || '',
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `disciplesheep-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import (step 1 — read & validate file) ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data._version || !data._exportedAt) throw new Error('Not a valid Disciplesheep backup file.');
        setPendingData(data);
        setShowConfirm(true);
        setImportStatus(null);
      } catch (err) {
        setImportStatus('error');
        setImportMsg(err.message || 'Invalid file. Please use a Disciplesheep backup.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ── Import (step 2 — actually write to localStorage) ──
  const confirmImport = () => {
    try {
      DATA_KEYS.forEach(key => {
        if (pendingData[key] !== undefined && pendingData[key] !== null) {
          localStorage.setItem(key, JSON.stringify(pendingData[key]));
        }
      });
      if (pendingData._profile) {
        if (pendingData._profile.name)  localStorage.setItem('profile_name',  pendingData._profile.name);
        if (pendingData._profile.photo) localStorage.setItem('profile_photo', pendingData._profile.photo);
      }
      setImportStatus('success');
      setImportMsg('Data imported! Reloading app...');
      setShowConfirm(false);
      setPendingData(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setImportStatus('error');
      setImportMsg('Something went wrong during import. Please try again.');
      setShowConfirm(false);
    }
  };

  const cancelImport = () => { setShowConfirm(false); setPendingData(null); };

  // Count records for confirm dialog
  const recordCounts = pendingData ? [
    pendingData.peopleContacts?.length  ? `${pendingData.peopleContacts.length} contacts`  : null,
    pendingData.expenses?.length        ? `${pendingData.expenses.length} expenses`        : null,
    Object.keys(pendingData.dailyEntries || {}).length ? `${Object.keys(pendingData.dailyEntries).length} journal entries` : null,
    pendingData.calendarEvents?.length  ? `${pendingData.calendarEvents.length} events`    : null,
  ].filter(Boolean) : [];

  return (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="backup-card">
      <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">Backup & Restore</h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
        Export your data to transfer to a new device, or restore from a previous backup.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Export button */}
        <button
          onClick={handleExport}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-900/20 hover:bg-forest-100 dark:hover:bg-forest-900/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-forest-500 flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-forest-900 dark:text-forest-300">Export</p>
            <p className="text-[10px] text-forest-700 dark:text-forest-500">Save backup file</p>
          </div>
        </button>

        {/* Import button */}
        <button
          onClick={() => importRef.current?.click()}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/40 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-stone-500 dark:bg-stone-600 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Import</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">Load backup file</p>
          </div>
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />

      {/* How to use steps */}
      <div className="rounded-xl bg-stone-50 dark:bg-stone-700/40 p-4 space-y-2 mb-4">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">How to transfer to a new device:</p>
        {[
          'Tap Export → saves a .json file',
          'Send it to yourself (WhatsApp, email, Drive)',
          'Open this app on the new device',
          'Tap Import → pick the .json file → done ✅',
        ].map((step, i) => (
          <p key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
            <span className="w-4 h-4 rounded-full bg-forest-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            {step}
          </p>
        ))}
      </div>

      {/* Status messages */}
      {importStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800">
          <CheckCircle className="w-4 h-4 text-forest-600 shrink-0" />
          <p className="text-xs text-forest-700 dark:text-forest-400 font-medium">{importMsg}</p>
        </div>
      )}
      {importStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{importMsg}</p>
        </div>
      )}

      {/* Confirm import dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelImport} />
          <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">Replace all data?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
              This will overwrite everything currently on this device with the backup from:
            </p>
            <p className="text-xs font-mono bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2 text-stone-700 dark:text-stone-300 mb-3">
              {pendingData?._exportedAt ? new Date(pendingData._exportedAt).toLocaleString() : ''}
            </p>
            {recordCounts.length > 0 && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Contains: {recordCounts.join(', ')}
              </p>
            )}
            <p className="text-xs text-red-500 mb-4 font-medium">⚠️ Your current data will be replaced. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={cancelImport} className="flex-1 h-11 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
                Cancel
              </button>
              <button onClick={confirmImport} className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-sm font-semibold transition-colors">
                Yes, Import
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ── Main Settings Page ────────────────────────────────────────────────────────
const Settings = () => {
  const { themeMode, changeThemeMode, fontSize, changeFontSize } = useTheme();

  const getThemeIcon = () => {
    if (themeMode === 'auto')  return <Sunrise className="w-5 h-5 text-stone-600 dark:text-stone-300" />;
    if (themeMode === 'dark')  return <Moon    className="w-5 h-5 text-stone-600 dark:text-stone-300" />;
    return                            <Sun     className="w-5 h-5 text-stone-600 dark:text-stone-300" />;
  };

  const getThemeDescription = () => {
    if (themeMode === 'auto') {
      const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
      return `Auto · currently ${isDay ? 'day' : 'night'} mode`;
    }
    return themeMode === 'dark' ? 'Always night mode' : 'Always day mode';
  };

  const themeOptions = [
    { value: 'light', label: 'Day',   icon: <Sun     style={{ width:15, height:15 }} /> },
    { value: 'dark',  label: 'Night', icon: <Moon    style={{ width:15, height:15 }} /> },
    { value: 'auto',  label: 'Auto',  icon: <Sunrise style={{ width:15, height:15 }} /> },
  ];

  const fontSizeOptions = [
    { value: 'small',  label: 'Small'   },
    { value: 'medium', label: 'Medium'  },
    { value: 'large',  label: 'Large'   },
    { value: 'xlarge', label: 'X-Large' },
  ];

  const getFontSizeDescription = () => {
    const descriptions = {
      small:  'Easy reading — ideal for longer sessions',
      medium: 'Comfortable large — great for daily use',
      large:  'Maximum size — easiest on the eyes',
      xlarge: 'Extra large — for maximum comfort',
    };
    return descriptions[fontSize] || descriptions.small;
  };

  return (
    <>
      <style>{`
        :root {
          --seg-bg:            rgba(120,113,108,0.11);
          --seg-pill:          #ffffff;
          --seg-active-text:   #1c1917;
          --seg-inactive-text: #78716c;
          --preview-bg:        rgba(120,113,108,0.06);
          --preview-border:    rgba(120,113,108,0.18);
          --preview-text:      #292524;
          --preview-muted:     #a8a29e;
        }
        .dark {
          --seg-bg:            rgba(41,37,36,0.7);
          --seg-pill:          #57534e;
          --seg-active-text:   #f5f5f4;
          --seg-inactive-text: #a8a29e;
          --preview-bg:        rgba(41,37,36,0.5);
          --preview-border:    rgba(68,64,60,0.6);
          --preview-text:      #e7e5e4;
          --preview-muted:     #78716c;
        }
      `}</style>

      <div className="space-y-6 pb-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-8 text-white bg-stone-800 dark:bg-stone-900" data-testid="settings-header">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8" />
              <h1 className="font-serif text-3xl font-bold tracking-tight">Settings</h1>
            </div>
            <p className="text-white/80">Customize your journal experience</p>
          </div>
        </div>

        {/* Appearance */}
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="appearance-card">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">Appearance</h2>
          <div className="mb-6 pb-6 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              {getThemeIcon()}
              <div>
                <Label className="text-sm font-semibold text-stone-900 dark:text-stone-100">Theme</Label>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{getThemeDescription()}</p>
              </div>
            </div>
            <SegmentedToggle name="Theme mode" options={themeOptions} value={themeMode} onChange={changeThemeMode} />
            <p className="mt-2 text-xs text-center text-stone-400 dark:text-stone-500">
              {themeMode === 'auto' ? 'Switches automatically at 6 am and 6 pm' : themeMode === 'dark' ? 'Night mode is always on' : 'Day mode is always on'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Type className="w-5 h-5 text-stone-600 dark:text-stone-300" />
              <div>
                <Label className="text-sm font-semibold text-stone-900 dark:text-stone-100">Font Size</Label>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{getFontSizeDescription()}</p>
              </div>
            </div>
            <SegmentedToggle name="Font size" options={fontSizeOptions} value={fontSize} onChange={changeFontSize} />
            <FontPreview fontSize={fontSize} />
          </div>
        </Card>

        {/* Security */}
        <SecurityCard />

        {/* Backup & Restore */}
        <DataBackupCard />

        {/* Data & Storage */}
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="data-card">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">Data & Storage</h2>
          <div className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            {[
              { color: 'bg-green-500', text: 'All data saved locally in your browser' },
              { color: 'bg-green-500', text: 'Works offline — no internet needed' },
              { color: 'bg-green-500', text: 'Auto-saves as you type' },
              { color: 'bg-blue-500',  text: 'Your data never leaves your device' },
            ].map((item, i) => (
              <p key={i} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                {item.text}
              </p>
            ))}
          </div>
        </Card>

        {/* About */}
        <Card className="bg-forest-50 dark:bg-stone-800 rounded-xl border border-forest-100 dark:border-stone-700 p-6">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Disciplesheep</h2>
          <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">Version 1.0 · Church Planter's Companion</p>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            A 6-year devotional and ministry tracker for church planters.
            Track your daily walk, discipleship multiplication, and stewardship in Puerto Princesa.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-4 italic">
            "Numbers are not the gospel — but they are the fingerprints of faithfulness."
          </p>
        </Card>

      </div>
    </>
  );
};

export default Settings;