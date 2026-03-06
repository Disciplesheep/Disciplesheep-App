import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useOutletContext } from 'react-router-dom';
import { useJournalData } from '@/hooks/useLocalStorage';
import { useDiscipleshipTracking } from '@/hooks/useDiscipleshipTracking';
import { Save, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDate, formatDisplayDate, DAILY_TASKS } from '@/utils/dateUtils';
import { getDevotionalForDate, getCurrentMinistryYear, getYearTargets } from '@/data/dailyDevotionals';

const JournalEntry = () => {
  // Receive shared date state from Layout
  const { journalDate: selectedDate, setJournalDate: setSelectedDate } = useOutletContext();

  const dateKey = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries, peopleContacts, expenses } = useJournalData();
  const { disciples } = useDiscipleshipTracking();

  const currentYear = getCurrentMinistryYear(selectedDate);
  const yearTargets  = getYearTargets(currentYear);
  const devotional   = getDevotionalForDate(dateKey);

  const blankEntry = (dev) => ({
    passage:      dev.passage,
    keyVerse:     dev.keyVerse,
    keyVerseText: dev.keyVerseText,
    principle:    dev.principle,
    practice:     dev.practice,
    praises: '',
    prayer:  '',
    tasks:   [],
  });

  const [entry, setEntry] = useState(dailyEntries[dateKey] || blankEntry(devotional));

  useEffect(() => {
    const dev = getDevotionalForDate(dateKey);
    setEntry(dailyEntries[dateKey] || blankEntry(dev));
  }, [dateKey, dailyEntries]);

  const handleSave = () => {
    setDailyEntries(prev => ({
      ...prev,
      [dateKey]: { ...entry, updatedAt: new Date().toISOString() },
    }));
    toast.success('Journal entry saved!', { description: formatDisplayDate(selectedDate) });
  };

  const handleTaskToggle = (task) => {
    const newTasks = entry.tasks.includes(task)
      ? entry.tasks.filter(t => t !== task)
      : [...entry.tasks, task];
    setEntry({ ...entry, tasks: newTasks });
  };

  const currentMonth  = format(new Date(), 'yyyy-MM');
  const monthPeople   = peopleContacts.filter(p => p.date?.startsWith(currentMonth)).length;
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);

  const peopleProgress   = Math.round((monthPeople   / yearTargets.monthly.peopleContacted) * 100);
  const budgetProgress   = Math.round((monthExpenses  / yearTargets.monthly.budgetLimit)    * 100);
  const discipleProgress = yearTargets.yearly.disciples
    ? Math.round((disciples.length / yearTargets.yearly.disciples) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-6">

      {/* Daily Tasks */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="daily-tasks-card">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">Daily Tasks</h2>
        <div className="space-y-3">
          {DAILY_TASKS.map((task, idx) => (
            <div key={idx} className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTaskToggle(task)}>
              <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                entry.tasks.includes(task)
                  ? 'bg-forest-500 border-forest-500'
                  : 'bg-white border-stone-300 dark:bg-stone-700 dark:border-stone-500'
              }`}>
                {entry.tasks.includes(task) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-stone-700 dark:text-stone-300 flex-1">{task}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
          <p className="text-sm text-stone-600 dark:text-stone-200">
            <CheckCircle2 className="w-4 h-4 inline mr-1 text-forest-500 dark:text-forest-400" />
            {entry.tasks.length} of {DAILY_TASKS.length} completed
          </p>
        </div>
      </Card>

      {/* Goals & Progress */}
      <Card className="bg-gradient-to-br from-mango-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 rounded-xl shadow-sm border border-mango-100 dark:border-stone-600 p-6" data-testid="goals-progress-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-mango-700 dark:text-yellow-400" />
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-yellow-50">
            Year {currentYear}: {yearTargets.phase}
          </h2>
        </div>
        <p className="text-xs text-stone-600 dark:text-yellow-100 mb-4 italic">"{yearTargets.motto}"</p>

        <div className="space-y-4">
          {[
            { label: 'People Contacted (Monthly)', value: monthPeople,         target: yearTargets.monthly.peopleContacted, progress: peopleProgress,   color: 'bg-forest-500', note: `${peopleProgress}% of monthly target` },
            { label: 'Disciples (Yearly)',          value: disciples.length,    target: yearTargets.yearly.disciples,        progress: discipleProgress, color: 'bg-blue-500',   note: `${discipleProgress}% of year ${currentYear} target` },
            { label: 'Budget Used (Monthly)',       value: `₱${monthExpenses.toFixed(0)}`, target: `₱${yearTargets.monthly.budgetLimit}`, progress: budgetProgress, color: budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 75 ? 'bg-yellow-500' : 'bg-forest-500', note: `${budgetProgress}% used · ₱${(yearTargets.monthly.budgetLimit - monthExpenses).toFixed(0)} remaining` },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-700 dark:text-gray-100 font-medium">{item.label}</span>
                <span className="font-mono font-bold text-stone-900 dark:text-yellow-50">{item.value} / {item.target}</span>
              </div>
              <div className="w-full bg-white/60 dark:bg-stone-600 rounded-full h-2.5">
                <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(item.progress, 100)}%` }} />
              </div>
              <p className="text-xs text-stone-600 dark:text-gray-200 mt-1">{item.note}</p>
            </div>
          ))}
          <div className="pt-3 border-t border-mango-200 dark:border-stone-500">
            <p className="text-xs text-stone-700 dark:text-gray-100">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              <strong className="text-stone-900 dark:text-yellow-50">Year {currentYear} Goal:</strong>{' '}
              {yearTargets.yearly.attendanceGoal} attendance, {yearTargets.yearly.totalPeopleReached} total reached
            </p>
          </div>
        </div>
      </Card>

      {/* 5P's Devotional */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="journal-5ps-card">
        <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">5P's Devotional</h2>
        <p className="text-xs text-mango-600 dark:text-mango-400 font-medium mb-6 uppercase tracking-wide">
          Daily Scripture for Church Planting Journey
        </p>

        <div className="space-y-6">
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">📖 Passage (NASB)</Label>
            <div className="bg-forest-50/50 dark:bg-forest-900/30 border-l-4 border-forest-500 p-4 rounded-r-lg">
              <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed italic">{entry.passage}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2 block">🔑 Key Verse - {entry.keyVerse}</Label>
            <div className="bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">"{entry.keyVerseText}"</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">💡 Principle - Timeless Truth for Church Planting</Label>
            <div className="bg-stone-50 dark:bg-stone-700 border-l-4 border-stone-400 dark:border-stone-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{entry.principle}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">✓ Practice - Today's Action Step</Label>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">{entry.practice}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-mango-500 dark:text-mango-400 font-bold mb-2 block">🙌 Praises - What do I thank God for?</Label>
            <Textarea
              value={entry.praises}
              onChange={(e) => setEntry({ ...entry, praises: e.target.value })}
              placeholder="Express your gratitude based on today's passage..."
              className="min-h-[100px] lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              data-testid="praises-input"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">🙏 Prayer - My prayers for today</Label>
            <Textarea
              value={entry.prayer}
              onChange={(e) => setEntry({ ...entry, prayer: e.target.value })}
              placeholder="Pray the passage back to God, intercede for Timothys and Puerto Princesa..."
              className="min-h-[120px] lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              data-testid="prayer-input"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full mt-6 bg-forest-500 hover:bg-forest-900 text-white rounded-full h-12 font-serif shadow-lg"
          data-testid="save-journal-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Journal Entry
        </Button>
      </Card>
    </div>
  );
};

export default JournalEntry;