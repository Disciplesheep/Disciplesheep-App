import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useJournalData } from '@/hooks/useLocalStorage';
import { CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/utils/dateUtils';
import { getDevotionalForDate } from '@/data/dailyDevotionals';

const JournalEntry = () => {
  const { journalDate: selectedDate } = useOutletContext();

  const dateKey  = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries } = useJournalData();
  const devotional  = getDevotionalForDate(dateKey);

  // Always merge devotional fields so passage/keyVerse/principle/practice
  // are never blank even if the entry was saved before these fields existed.
  const buildEntry = (dev, saved = {}) => ({
    passage:      dev.passage,
    keyVerse:     dev.keyVerse,
    keyVerseText: dev.keyVerseText,
    principle:    dev.principle,
    practice:     dev.practice,
    praises: saved.praises || '',
    prayer:  saved.prayer  || '',
    tasks:   saved.tasks   || [],
  });

  const [entry, setEntry]       = useState(buildEntry(devotional, dailyEntries[dateKey]));
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'pending'

  // Rebuild entry when date changes
  useEffect(() => {
    const dev = getDevotionalForDate(dateKey);
    setEntry(buildEntry(dev, dailyEntries[dateKey]));
    setSaveStatus('saved');
  }, [dateKey, dailyEntries]);

  // ── Auto-save: debounce 1.5s after last change ────────────────────────────
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render to avoid overwriting with blank praises/prayer
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    setSaveStatus('pending');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDailyEntries(prev => ({
        ...prev,
        [dateKey]: { ...entry, updatedAt: new Date().toISOString() },
      }));
      setSaveStatus('saved');
    }, 1500);

    return () => clearTimeout(saveTimer.current);
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 pb-6">

      {/* 5P's Devotional */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="journal-5ps-card">

        {/* Header + auto-save indicator */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">5P's Devotional</h2>
          <span className={`flex items-center gap-1 text-xs font-medium transition-colors ${saveStatus === 'saved' ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400 dark:text-stone-500'}`}>
            {saveStatus === 'saved'
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
              : <><Clock className="w-3.5 h-3.5 animate-pulse" /> Saving…</>
            }
          </span>
        </div>
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
            <Label className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2 block">🔑 Key Verse — {entry.keyVerse}</Label>
            <div className="bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">"{entry.keyVerseText}"</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">💡 Principle — Timeless Truth for Church Planting</Label>
            <div className="bg-stone-50 dark:bg-stone-700 border-l-4 border-stone-400 dark:border-stone-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{entry.principle}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">✓ Practice — Today's Action Step</Label>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">{entry.practice}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-mango-500 dark:text-mango-400 font-bold mb-2 block">🙌 Praises — What do I thank God for?</Label>
            <Textarea
              value={entry.praises}
              onChange={(e) => setEntry({ ...entry, praises: e.target.value })}
              placeholder="Express your gratitude based on today's passage..."
              className="min-h-[100px] lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              data-testid="praises-input"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">🙏 Prayer — My prayers for today</Label>
            <Textarea
              value={entry.prayer}
              onChange={(e) => setEntry({ ...entry, prayer: e.target.value })}
              placeholder="Pray the passage back to God, intercede for Timothys and Puerto Princesa..."
              className="min-h-[120px] lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
              data-testid="prayer-input"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JournalEntry;