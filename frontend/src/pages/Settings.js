import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sunrise, Type, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

  return (
    <div className="space-y-6 pb-6">
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
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="appearance-card">
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
          <RadioGroup value={themeMode} onValueChange={changeThemeMode}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="light" id="theme-light" data-testid="theme-light" />
              <Label htmlFor="theme-light" className="text-sm cursor-pointer text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Day mode - Always light
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="dark" id="theme-dark" data-testid="theme-dark" />
              <Label htmlFor="theme-dark" className="text-sm cursor-pointer text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Night mode - Always dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="theme-auto" data-testid="theme-auto" />
              <Label htmlFor="theme-auto" className="text-sm cursor-pointer text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Sunrise className="w-4 h-4" />
                Auto - Day mode (6am-6pm), Night mode (6pm-6am)
              </Label>
            </div>
          </RadioGroup>
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
          <RadioGroup value={fontSize} onValueChange={changeFontSize}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="small" id="small" data-testid="font-small" />
              <Label htmlFor="small" className="text-sm cursor-pointer text-stone-700 dark:text-stone-300">
                Small - Compact view
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="medium" id="medium" data-testid="font-medium" />
              <Label htmlFor="medium" className="text-base cursor-pointer text-stone-700 dark:text-stone-300">
                Medium - Comfortable (Default)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="large" data-testid="font-large" />
              <Label htmlFor="large" className="text-lg cursor-pointer text-stone-700 dark:text-stone-300">
                Large - Easy reading
              </Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {/* Data & Storage */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="data-card">
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
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Sow & Reap Journal</h2>
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
