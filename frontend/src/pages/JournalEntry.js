import React, { useState, useEffect } from 'react';
import { format, addYears } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { useDiscipleshipTracking } from '@/hooks/useDiscipleshipTracking';
import { Calendar, Save, CheckCircle2, Target, TrendingUp, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { formatDate, formatDisplayDate, DAILY_TASKS } from '@/utils/dateUtils';
import { getDevotionalForDate, getCurrentMinistryYear, getYearTargets, CHURCH_PLANT_START_DATE } from '@/data/dailyDevotionals';

const JournalEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries, peopleContacts, expenses } = useJournalData();
  const { disciples } = useDiscipleshipTracking();

  // Get current ministry year and targets
  const currentYear = getCurrentMinistryYear(selectedDate);
  const yearTargets = getYearTargets(currentYear);

  // Get pre-filled devotional content
  const devotional = getDevotionalForDate(dateKey);

  const currentEntry = dailyEntries[dateKey] || {
    passage: devotional.passage,
    keyVerse: devotional.keyVerse,
    keyVerseText: devotional.keyVerseText,
    principle: devotional.principle,
    practice: devotional.practice,
    praises: '',
    prayer: '',
    tasks: []
  };

  const [entry, setEntry] = useState(currentEntry);

  // Update entry when date changes
  useEffect(() => {
    const newDevotional = getDevotionalForDate(dateKey);
    const newEntry = dailyEntries[dateKey] || {
      passage: newDevotional.passage,
      keyVerse: newDevotional.keyVerse,
      keyVerseText: newDevotional.keyVerseText,
      principle: newDevotional.principle,
      practice: newDevotional.practice,
      praises: '',
      prayer: '',
      tasks: []
    };
    setEntry(newEntry);
  }, [dateKey, dailyEntries]);

  const handleSave = () => {
    setDailyEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...entry,
        updatedAt: new Date().toISOString()
      }
    }));
    toast.success('Journal entry saved successfully!', {
      description: formatDisplayDate(selectedDate)
    });
  };

  const handleTaskToggle = (task) => {
    const newTasks = entry.tasks.includes(task)
      ? entry.tasks.filter(t => t !== task)
      : [...entry.tasks, task];
    setEntry({ ...entry, tasks: newTasks });
  };

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Calculate 6-year date range
  const ministryEndDate = addYears(CHURCH_PLANT_START_DATE, 6);
  const minDate = CHURCH_PLANT_START_DATE;
  const maxDate = ministryEndDate;

  // Calculate progress metrics
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthPeople = peopleContacts.filter(p => p.date?.startsWith(currentMonth)).length;
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  
  const peopleProgress = Math.round((monthPeople / yearTargets.monthly.peopleContacted) * 100);
  const budgetProgress = Math.round((monthExpenses / yearTargets.monthly.budgetLimit) * 100);
  const discipleProgress = yearTargets.yearly.disciples 
    ? Math.round((disciples.length / yearTargets.yearly.disciples) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Date Navigator */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4" data-testid="date-navigator">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => handleDateChange(-1)}
            className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
            data-testid="prev-day-btn"
          >
            ← Prev
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-forest-500 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 hover:bg-forest-50 dark:hover:bg-stone-700"
                data-testid="date-picker-trigger"
              >
                <CalendarDays className="w-4 h-4" />
                <div className="text-center">
                  <div className="font-serif text-lg font-semibold">{formatDisplayDate(selectedDate)}</div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">{format(selectedDate, 'EEEE')}</p>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                fromDate={minDate}
                toDate={maxDate}
                defaultMonth={selectedDate}
                initialFocus
              />
              <div className="p-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                <p className="text-xs text-stone-600 dark:text-stone-400 text-center">
                  6-Year Journal: {format(minDate, 'MMM yyyy')} - {format(maxDate, 'MMM yyyy')}
                </p>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            onClick={() => handleDateChange(1)}
            className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
            data-testid="next-day-btn"
          >
            Next →
          </Button>
        </div>
      </Card>

      {/* Daily Tasks Checklist */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="daily-tasks-card">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">Daily Tasks</h2>
        <div className="space-y-3">
          {DAILY_TASKS.map((task, idx) => (
            <div key={idx} className="flex items-center space-x-3" onClick={() => handleTaskToggle(task)}>
              <div
                className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center cursor-pointer ${
                  entry.tasks.includes(task)
                    ? 'bg-forest-500 border-forest-500'
                    : 'bg-white border-stone-300 dark:bg-stone-700 dark:border-stone-500'
                }`}
              >
                {entry.tasks.includes(task) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-stone-700 dark:text-stone-300 cursor-pointer flex-1">
                {task}
              </span>
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
        <p className="text-xs text-stone-600 dark:text-yellow-100 mb-4 italic">\"{yearTargets.motto}\"</p>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-700 dark:text-gray-100 font-medium">People Contacted (Monthly)</span>
              <span className="font-mono font-bold text-stone-900 dark:text-yellow-50">
                {monthPeople} / {yearTargets.monthly.peopleContacted}
              </span>
            </div>
            <div className="w-full bg-white/60 dark:bg-stone-600 rounded-full h-2.5">
              <div 
                className="bg-forest-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(peopleProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 dark:text-gray-200 mt-1">{peopleProgress}% of monthly target</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-700 dark:text-gray-100 font-medium">Disciples (Yearly)</span>
              <span className="font-mono font-bold text-stone-900 dark:text-yellow-50">
                {disciples.length} / {yearTargets.yearly.disciples}
              </span>
            </div>
            <div className="w-full bg-white/60 dark:bg-stone-600 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(discipleProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 dark:text-gray-200 mt-1">{discipleProgress}% of year {currentYear} target</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-700 dark:text-gray-100 font-medium">Budget Used (Monthly)</span>
              <span className="font-mono font-bold text-stone-900 dark:text-yellow-50">
                ₱{monthExpenses.toFixed(0)} / ₱{yearTargets.monthly.budgetLimit}
              </span>
            </div>
            <div className="w-full bg-white/60 dark:bg-stone-600 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all ${
                  budgetProgress > 90 ? 'bg-red-500' : 
                  budgetProgress > 75 ? 'bg-yellow-500' : 
                  'bg-forest-500'
                }`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 dark:text-gray-200 mt-1">
              {budgetProgress}% used • ₱{(yearTargets.monthly.budgetLimit - monthExpenses).toFixed(0)} remaining
            </p>
          </div>

          <div className="pt-3 border-t border-mango-200 dark:border-stone-500">
            <p className="text-xs text-stone-700 dark:text-gray-100">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              <strong className="text-stone-900 dark:text-yellow-50">Year {currentYear} Goal:</strong> {yearTargets.yearly.attendanceGoal} attendance, {yearTargets.yearly.totalPeopleReached} total reached
            </p>
          </div>
        </div>
      </Card>

      {/* 5P's Journal */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="journal-5ps-card">
        <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">5P's Devotional</h2>
        <p className="text-xs text-mango-600 dark:text-mango-400 font-medium mb-6 uppercase tracking-wide">
          Daily Scripture for Church Planting Journey
        </p>
        
        <div className="space-y-6">
          {/* Passage - Pre-filled, read-only */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">
              📖 Passage (NASB)
            </Label>
            <div className="bg-forest-50/50 dark:bg-forest-900/30 border-l-4 border-forest-500 p-4 rounded-r-lg">
              <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed italic">
                {entry.passage}
              </p>
            </div>
          </div>

          {/* Key Verse - Pre-filled, read-only */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2 block">
              🔑 Key Verse - {entry.keyVerse}
            </Label>
            <div className="bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">
                "{entry.keyVerseText}"
              </p>
            </div>
          </div>

          {/* Principle - Pre-filled, read-only */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">
              💡 Principle - Timeless Truth for Church Planting
            </Label>
            <div className="bg-stone-50 dark:bg-stone-700 border-l-4 border-stone-400 dark:border-stone-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {entry.principle}
              </p>
            </div>
          </div>

          {/* Practice - Pre-filled, read-only */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">
              ✓ Practice - Today's Action Step
            </Label>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                {entry.practice}
              </p>
            </div>
          </div>

          {/* Praises - User input */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-mango-500 dark:text-mango-400 font-bold mb-2 block">
              🙌 Praises - What do I thank God for?
            </Label>
            <Textarea
              value={entry.praises}
              onChange={(e) => setEntry({ ...entry, praises: e.target.value })}
              placeholder="Express your gratitude based on today's passage..."
              className="min-h-[100px] lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              data-testid="praises-input"
            />
          </div>

          {/* Prayer - User input */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">
              🙏 Prayer - My prayers for today
            </Label>
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