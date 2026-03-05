import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sunrise, Type, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

/* ─── Animated Segmented Toggle ─────────────────────────────────────────── */
const SegmentedToggle = ({ options, value, onChange, name }) => {
  const selectedIndex = options.findIndex(o => o.value === value);

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="relative flex w-full rounded-xl p-1 gap-1"
      style={{
        background: 'var(--toggle-bg, rgba(120,113,108,0.12))',
      }}
    >
      {/* Sliding pill */}
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: `calc(${100 / options.length}% - ${8 / options.length}px)`,
          left: `calc(${selectedIndex * (100 / options.length)}% + 4px)`,
          background: 'var(--toggle-pill, white)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        }}
      />

      {options.map(opt => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`
              relative z-10 flex flex-1 items-center justify-center gap-2 py-2.5 px-3 rounded-lg
              text-sm font-medium transition-colors duration-200 cursor-pointer select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
              focus-visible:ring-stone-400
              ${isSelected
                ? 'text-stone-900 dark:text-stone-900'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }
            `}
          >
            {opt.icon && (
              <span className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                {opt.icon}
              </span>
            )}
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel ?? opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ─── Main Settings Component ───────────────────────────────────────────── */
const Settings = () => {
  const { themeMode, actualTheme, changeThemeMode, fontSize, changeFontSize } = useTheme();

  const getThemeIcon = () => {
    if (themeMode === 'auto') return <Sunrise className="w-5 h-5 text-stone-700 dark:text-stone-300" />;
    if (themeMode === 'dark') return <Moon className="w-5 h-5 text-stone-700 dark:text-stone-300" />;
    return <Sun className="w-5 h-5 text-stone-700 dark:text-stone-300" />;
  };

  const getThemeDescription = () => {
    if (themeMode === 'auto') {
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour < 18;
      return `Auto (Currently: ${isDay ? 'Day' : 'Night'} mode)`;
    }
    return themeMode === 'dark' ? 'Night mode' : 'Day mode';
  };

  const themeOptions = [
    {
      value: 'light',
      label: 'Day',
      shortLabel: 'Day',
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: 'dark',
      label: 'Night',
      shortLabel: 'Night',
      icon: <Moon className="w-4 h-4" />,
    },
    {
      value: 'auto',
      label: 'Auto',
      shortLabel: 'Auto',
      icon: <Sunrise className="w-4 h-4" />,
    },
  ];

  const fontSizeOptions = [
    { value: 'small',  label: 'Small',  shortLabel: 'S' },
    { value: 'medium', label: 'Medium', shortLabel: 'M' },
    { value: 'large',  label: 'Large',  shortLabel: 'L' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* CSS vars for the toggle — respects dark mode */}
      <style>{`
        .dark [role="radiogroup"] {
          --toggle-bg: rgba(68,64,60,0.6);
          --toggle-pill: #44403c;
        }
        [role="radiogroup"] {
          --toggle-bg: rgba(120,113,108,0.12);
          --toggle-pill: #ffffff;
        }
        .dark [role="radiogroup"] button[aria-checked="true"] {
          color: #e7e5e4 !important;
        }
      `}</style>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 text-white bg-stone-800 dark:bg-stone-900"
        data-testid="settings-header"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-white/80">Customize your journal experience</p>
        </div>
      </div>

      {/* Appearance */}
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6"
        data-testid="appearance-card"
      >
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">Appearance</h2>

        {/* Theme Mode */}
        <div className="mb-6 pb-6 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            {getThemeIcon()}
            <div>
              <Label className="text-base font-medium text-stone-900 dark:text-stone-100">Theme</Label>
              <p className="text-sm text-stone-600 dark:text-stone-400">{getThemeDescription()}</p>
            </div>
          </div>
          <SegmentedToggle
            name="Theme mode"
            options={themeOptions}
            value={themeMode}
            onChange={changeThemeMode}
          />
          {/* Sub-label hint */}
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500 text-center">
            {themeMode === 'auto' ? 'Switches automatically at 6 am / 6 pm' :
             themeMode === 'dark' ? 'Always night mode' : 'Always day mode'}
          </p>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <div>
              <Label className="text-base font-medium text-stone-900 dark:text-stone-100">Font Size</Label>
              <p className="text-sm text-stone-600 dark:text-stone-400">Adjust reading comfort</p>
            </div>
          </div>
          <SegmentedToggle
            name="Font size"
            options={fontSizeOptions}
            value={fontSize}
            onChange={changeFontSize}
          />
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500 text-center">
            {fontSize === 'small' ? 'Compact view' :
             fontSize === 'large' ? 'Easy reading' : 'Comfortable — default'}
          </p>
        </div>
      </Card>

      {/* Data & Storage */}
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6"
        data-testid="data-card"
      >
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">Data & Storage</h2>
        <div className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            All data saved locally in your browser
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Works offline - no internet needed
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Auto-saves as you type
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Your data never leaves your device
          </p>
        </div>
      </Card>

      {/* About */}
      <Card className="bg-forest-50 dark:bg-stone-800 rounded-xl border border-forest-100 dark:border-stone-700 p-6">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Disciplesheep</h2>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">Version 1.0 - Church Planter's Companion</p>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          A 6-year devotional and ministry tracker for church planters.
          Track your daily walk, discipleship multiplication, and stewardship in Puerto Princesa.
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-500 mt-4 italic">
          "Numbers are not the gospel — but they are the fingerprints of faithfulness."
        </p>
      </Card>
    </div>
  );
};

export default Settings;
