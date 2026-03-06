import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useJournalData } from '@/hooks/useLocalStorage';
import { CheckCircle2, Clock, BookOpen, FileText, Upload, Maximize2, Minimize2, Trash2, FolderOpen, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/dateUtils';
import { getDevotionalForDate } from '@/data/dailyDevotionals';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

/* ── Saved PDF record shape: { id, name, size, dataUrl, savedAt } ── */

const JournalEntry = () => {
  const { journalDate: selectedDate } = useOutletContext();

  const dateKey  = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries } = useJournalData();
  const devotional  = getDevotionalForDate(dateKey);

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

  const [entry, setEntry]           = useState(buildEntry(devotional, dailyEntries[dateKey]));
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeTab, setActiveTab]   = useState('devotional'); // 'devotional' | 'pdf'

  useEffect(() => {
    const dev = getDevotionalForDate(dateKey);
    setEntry(buildEntry(dev, dailyEntries[dateKey]));
    setSaveStatus('saved');
  }, [dateKey, dailyEntries]);

  // ── Auto-save devotional ──────────────────────────────────────────────────
  const saveTimer      = useRef(null);
  const isFirstRender  = useRef(true);

  useEffect(() => {
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

  // ── PDF state ─────────────────────────────────────────────────────────────
  const [savedPdfs, setSavedPdfs]       = useLocalStorage('savedPdfs', []);
  const [activePdfUrl, setActivePdfUrl] = useState(null);   // currently previewing
  const [activePdfName, setActivePdfName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tempPdfUrl, setTempPdfUrl]     = useState(null);   // one-time view (not saved)
  const fileInputRef    = useRef();
  const tempFileRef     = useRef();
  const fullscreenRef   = useRef();

  const openSaved = (pdf) => {
    setActivePdfUrl(pdf.dataUrl);
    setActivePdfName(pdf.name);
    setTempPdfUrl(null);
  };

  const closePdf = () => {
    setActivePdfUrl(null);
    setActivePdfName('');
    setIsFullscreen(false);
    if (tempPdfUrl) { URL.revokeObjectURL(tempPdfUrl); setTempPdfUrl(null); }
  };

  const handleSaveFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error('PDF too large (max 15 MB)'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const newPdf  = { id: Date.now().toString(), name: file.name, size: file.size, dataUrl, savedAt: new Date().toISOString() };
      setSavedPdfs(prev => [newPdf, ...prev]);
      setActivePdfUrl(dataUrl);
      setActivePdfName(file.name);
      setTempPdfUrl(null);
      toast.success(`"${file.name}" saved!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTempView = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    const url = URL.createObjectURL(file);
    if (tempPdfUrl) URL.revokeObjectURL(tempPdfUrl);
    setTempPdfUrl(url);
    setActivePdfUrl(url);
    setActivePdfName(file.name);
    e.target.value = '';
  };

  const handleDeletePdf = (id, e) => {
    e.stopPropagation();
    setSavedPdfs(prev => prev.filter(p => p.id !== id));
    if (activePdfUrl === savedPdfs.find(p => p.id === id)?.dataUrl) closePdf();
    toast.success('PDF removed');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      fullscreenRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen(v => !v);
  };

  // Sync fullscreen state with browser Escape key
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Push a history entry when PDF viewer opens so Back button closes it
  useEffect(() => {
    if (activePdfUrl) {
      window.history.pushState({ pdfOpen: true }, '');
    }
  }, [activePdfUrl]);

  // Handle Back button — close PDF viewer instead of leaving page
  useEffect(() => {
    const onPopState = (e) => {
      if (activePdfUrl) {
        closePdf();
        // Don't navigate away
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activePdfUrl]);

  const fmtSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'devotional', icon: BookOpen,  label: "5P's" },
    { id: 'pdf',        icon: FileText,  label: 'PDF' },
  ];

  return (
    <div className="space-y-4 pb-6">

      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
            style={{ minHeight: 0 }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── DEVOTIONAL TAB ── */}
      {activeTab === 'devotional' && (
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="journal-5ps-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">5P's Devotional</h2>
            <span className={`flex items-center gap-1 text-xs font-medium transition-colors ${saveStatus === 'saved' ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400 dark:text-stone-500'}`}>
              {saveStatus === 'saved'
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
                : <><Clock className="w-3.5 h-3.5 animate-pulse" /> Saving…</>}
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
      )}

      {/* ── PDF TAB ── */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Save PDF */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-forest-300 dark:border-forest-700 text-forest-600 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors text-sm font-medium"
              style={{ minHeight: 0 }}
            >
              <Upload className="w-4 h-4" />
              Save PDF
            </button>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSaveFile} />

            {/* One-time view */}
            <button
              onClick={() => tempFileRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-sm font-medium"
              style={{ minHeight: 0 }}
            >
              <FolderOpen className="w-4 h-4" />
              Open Once
            </button>
            <input ref={tempFileRef} type="file" accept="application/pdf" className="hidden" onChange={handleTempView} />
          </div>

          {/* PDF Viewer */}
          {activePdfUrl && (
            <Card
              ref={fullscreenRef}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden"
              style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0, border: 'none' } : {}}
            >
              {/* Viewer toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate max-w-[60%]">
                  <FileText className="w-3.5 h-3.5 inline mr-1.5 text-stone-400" />
                  {activePdfName}
                  {tempPdfUrl && <span className="ml-2 text-xs text-stone-400">(not saved)</span>}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    style={{ minHeight: 0 }}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={closePdf}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 transition-colors"
                    title="Close"
                    style={{ minHeight: 0 }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PDF iframe */}
              <iframe
                src={activePdfUrl}
                title={activePdfName}
                className="w-full"
                style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '70vh', border: 'none', display: 'block' }}
              />
            </Card>
          )}

          {/* Saved PDFs list */}
          {savedPdfs.length > 0 && (
            <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
              <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm mb-3">
                Saved PDFs ({savedPdfs.length})
              </h3>
              <div className="space-y-2">
                {savedPdfs.map(pdf => (
                  <div
                    key={pdf.id}
                    onClick={() => openSaved(pdf)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      activePdfUrl === pdf.dataUrl
                        ? 'bg-forest-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 border border-transparent'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      activePdfUrl === pdf.dataUrl
                        ? 'bg-forest-100 dark:bg-forest-900/50'
                        : 'bg-stone-100 dark:bg-stone-700'
                    }`}>
                      <FileText className={`w-4 h-4 ${activePdfUrl === pdf.dataUrl ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{pdf.name}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{fmtSize(pdf.size)} · {new Date(pdf.savedAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeletePdf(pdf.id, e)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0"
                      style={{ minHeight: 0 }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {savedPdfs.length === 0 && !activePdfUrl && (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No PDFs saved yet</p>
              <p className="text-xs mt-1">Save a PDF to keep it here, or open once to view without saving</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntry;