import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sunrise, Type, Settings as SettingsIcon, Lock, ShieldCheck, ShieldOff, Eye, EyeOff } from 'lucide-react';
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
        {isCorrect && (
          <span className="text-forest-500 text-xs font-bold">✓</span>
        )}
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
  const [mode, setMode]       = useState(null); // 'set' | 'change' | 'remove'
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
      if (nextInput) {
        setTimeout(() => nextInput.focus(), 400);
      }
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

      {/* Status row */}
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

      {/* Action buttons */}
      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {!hasPassword && (
            <button onClick={() => setMode('set')}
              className="px-4 py-2 text-sm rounded-xl bg-forest-500 hover:bg-forest-600 text-white transition-colors">
              Set Password
            </button>
          )}
          {hasPassword && (
            <>
              <button onClick={() => setMode('change')}
                className="px-4 py-2 text-sm rounded-xl bg-forest-500 hover:bg-forest-600 text-white transition-colors">
                Change Password
              </button>
              <button onClick={() => setMode('remove')}
                className="px-4 py-2 text-sm rounded-xl border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Remove Password
              </button>
            </>
          )}
        </div>
      )}

      {/* Form */}
      {mode !== null && (
        <div className="space-y-3">
          {(mode === 'change' || mode === 'remove') && (
            <PwField
              label={mode === 'remove' ? 'Enter password to confirm removal' : 'Current password'}
              value={current}
              onChange={e => { setCurrent(e.target.value); setError(''); }}
              show={showPw}
              onToggle={() => setShowPw(v => !v)}
              autoFocus
              isCorrect={currentIsCorrect}
            />
          )}
          {(mode === 'set' || mode === 'change') && (
            <>
              <PwField
                label={mode === 'change' ? 'New password' : 'Password (min 4 characters)'}
                value={next}
                onChange={e => { setNext(e.target.value); setError(''); }}
                show={showPw}
                onToggle={() => setShowPw(v => !v)}
                autoFocus={mode === 'set'}
                data-field="new-password"
              />
              <PwField
                label="Confirm password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                show={showPw}
                onToggle={() => setShowPw(v => !v)}
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
            <button onClick={reset}
              className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
              Cancel
            </button>
            {mode !== 'remove' && (
              <button onClick={handleSubmit}
                className={`flex-1 h-10 rounded-xl text-white text-sm transition-colors ${mode === 'set' ? 'bg-forest-500 hover:bg-forest-600' : 'bg-forest-500 hover:bg-forest-600'}`}>
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
    { value: 'small',  label: 'Small'  },
    { value: 'medium', label: 'Medium' },
    { value: 'large',  label: 'Large'  },
  ];

  const getFontSizeDescription = () => {
    const descriptions = {
      small:  'Easy reading — ideal for longer sessions',
      medium: 'Comfortable large — great for daily use',
      large:  'Maximum size — easiest on the eyes',
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

        {/* Security — Delete Guard */}
        <SecurityCard />

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