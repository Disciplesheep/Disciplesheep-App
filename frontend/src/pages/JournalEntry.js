import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useJournalData, useLocalStorage } from '@/hooks/useLocalStorage';
import {
  CheckCircle2, Clock, BookOpen, FileText, FileUp, Maximize2, Minimize2,
  Trash2, X, FileType2, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/utils/dateUtils';
import { getDevotionalForDate } from '@/data/dailyDevotionals';
import { toast } from 'sonner';

/* ── Constants — module-level, never re-allocated ────────────────────────── */
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 32;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const TABS = [
  { id: 'devotional', icon: BookOpen, label: "5P's" },
  { id: 'pdf',        icon: FileText, label: 'Files' },
];

const WRITING_STYLE = {
  minHeight: '128px',
  height: 'auto',
  overflow: 'hidden',
  resize: 'none',
};

/* ── Pure helpers — module-level ─────────────────────────────────────────── */
const isPdf  = (name) => name?.toLowerCase().endsWith('.pdf');
const isDocx = (name) => !!name?.toLowerCase().match(/\.docx?$/);

const fmtSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const autoGrow = (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = e.target.scrollHeight + 'px';
};

const buildEntry = (dev, saved = {}) => ({
  passage:       dev.passage,
  keyVerse:      dev.keyVerse,
  keyVerseText:  dev.keyVerseText,
  principle:     dev.principle,
  practice:      dev.practice,
  practiceNotes: saved.practiceNotes || '',
  praises:       saved.praises || '',
  prayer:        saved.prayer  || '',
  tasks:         saved.tasks   || [],
});

const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const mime   = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/* ── Lazy mammoth loader — called at most once ───────────────────────────── */
let mammothPromise = null;
const loadMammoth = () => {
  if (mammothPromise) return mammothPromise;
  mammothPromise = new Promise((resolve, reject) => {
    if (window.mammoth) { resolve(window.mammoth); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    s.onload  = () => resolve(window.mammoth);
    s.onerror = () => { mammothPromise = null; reject(new Error('Failed to load mammoth.js')); };
    document.head.appendChild(s);
  });
  return mammothPromise;
};

/* ── FileIcon — pure, no state ───────────────────────────────────────────── */
const FileIcon = ({ name, className = 'w-4 h-4' }) =>
  isDocx(name) ? <FileType2 className={className} /> : <FileText className={className} />;

/* ── DocxViewer ──────────────────────────────────────────────────────────── */
const DocxViewer = ({ dataUrl, fontSize = 16 }) => {
  const [html,    setHtml]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setHtml('');
    (async () => {
      try {
        const mammoth = await loadMammoth();
        const base64  = dataUrl.split(',')[1];
        const binary  = atob(base64);
        const bytes   = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const result  = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (!cancelled) setHtml(result.value);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not convert document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dataUrl]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-stone-400 dark:text-stone-500">
      <Clock className="w-5 h-5 animate-spin mr-2" /> Converting document…
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-40 gap-2 text-red-400 text-sm p-4">
      <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
    </div>
  );
  return (
    <div
      className="prose prose-stone dark:prose-invert max-w-none p-6 overflow-y-auto"
      style={{ fontFamily: 'Georgia, serif', lineHeight: Math.max(1.3, 1.9 - (fontSize - 12) * 0.03), fontSize: `${fontSize}px` }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/* ── WritingField — prevents parent re-render from re-mounting textareas ─── */
const WritingField = React.memo(({ id, label, value, onChange, placeholder, testId }) => (
  <div>
    <Label htmlFor={id} className="text-xs uppercase tracking-widest text-mango-500 dark:text-mango-400 font-bold mb-2 block">
      {label}
    </Label>
    <Textarea
      id={id}
      value={value}
      onChange={onChange}
      onInput={autoGrow}
      placeholder={placeholder}
      className="lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 leading-[2rem] pt-1 pb-0"
      style={WRITING_STYLE}
      data-testid={testId}
    />
  </div>
));
WritingField.displayName = 'WritingField';

/* ── Main Component ──────────────────────────────────────────────────────── */
const JournalEntry = () => {
  const { journalDate: selectedDate } = useOutletContext();
  const dateKey    = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries } = useJournalData();
  const devotional = useMemo(() => getDevotionalForDate(dateKey), [dateKey]);

  const [entry,      setEntry]      = useState(() => buildEntry(devotional, dailyEntries[dateKey]));
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeTab,  setActiveTab]  = useState('devotional');

  // Rebuild entry when date changes
  useEffect(() => {
    setEntry(buildEntry(getDevotionalForDate(dateKey), dailyEntries[dateKey]));
    setSaveStatus('saved');
  }, [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const saveTimer     = useRef(null);
  const isFirstRender = useRef(true);

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

  // ── Stable field setters — no anonymous arrow fns in render ──────────────
  const setPracticeNotes = useCallback((e) => setEntry(prev => ({ ...prev, practiceNotes: e.target.value })), []);
  const setPraises       = useCallback((e) => setEntry(prev => ({ ...prev, praises: e.target.value })), []);
  const setPrayer        = useCallback((e) => setEntry(prev => ({ ...prev, prayer:  e.target.value })), []);

  // ── File state ────────────────────────────────────────────────────────────
  const [savedFiles,   setSavedFiles]   = useLocalStorage('savedPdfs', []);
  const [activeFile,   setActiveFile]   = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docFontSize,  setDocFontSize]  = useState(32);

  const fileInputRef  = useRef();
  const fullscreenRef = useRef();

  // Stable font size adjusters
  const decFontSize = useCallback(() => setDocFontSize(s => Math.max(FONT_SIZE_MIN, s - 2)), []);
  const incFontSize = useCallback(() => setDocFontSize(s => Math.min(FONT_SIZE_MAX, s + 2)), []);

  const closePdf = useCallback(() => {
    setActiveFile(null);
    setIsFullscreen(false);
  }, []);

  const openSaved = useCallback((file) => {
    setActiveFile({
      name: file.name,
      dataUrl: file.dataUrl,
      fileType: file.fileType || (isPdf(file.name) ? 'pdf' : 'docx'),
    });
  }, []);

  // Shared file reader
  const readFile = useCallback((file, onReady) => {
    if (!file) return;
    const valid = file.type.includes('pdf') || file.type.includes('word') || isPdf(file.name) || isDocx(file.name);
    if (!valid) { toast.error('Please select a PDF or Word (.docx) file'); return; }
    if (file.size > MAX_FILE_BYTES) { toast.error('File too large (max 15 MB)'); return; }
    const reader  = new FileReader();
    reader.onload = (ev) => onReady(ev.target.result, isPdf(file.name) ? 'pdf' : 'docx');
    reader.readAsDataURL(file);
  }, []);

  const handleSaveFile = useCallback((e) => {
    const file = e.target.files[0];
    readFile(file, (dataUrl, fileType) => {
      const newFile = { id: Date.now().toString(), name: file.name, size: file.size, fileType, dataUrl, savedAt: new Date().toISOString() };
      setSavedFiles(prev => [newFile, ...prev]);
      setActiveFile({ name: file.name, dataUrl, fileType });
      toast.success(`"${file.name}" saved!`);
    });
    e.target.value = '';
  }, [readFile, setSavedFiles]);

  const handleDeleteFile = useCallback((id, e) => {
    e.stopPropagation();
    const file = savedFiles.find(f => f.id === id);
    setSavedFiles(prev => prev.filter(f => f.id !== id));
    if (activeFile?.dataUrl === file?.dataUrl) closePdf();
    toast.success('File removed');
  }, [savedFiles, activeFile, setSavedFiles, closePdf]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) fullscreenRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
    setIsFullscreen(v => !v);
  }, [isFullscreen]);

  // Fullscreen escape listener
  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Back-button integration
  useEffect(() => {
    if (activeFile) window.history.pushState({ fileOpen: true }, '');
  }, [activeFile]);

  useEffect(() => {
    const onPopState = () => { if (activeFile) closePdf(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeFile, closePdf]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">

      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`} style={{ minHeight: 0 }}>
            <Icon className="w-4 h-4" />{label}
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
            {/* Passage */}
            <div>
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">📖 Passage (NASB)</p>
              <div className="bg-forest-50/50 dark:bg-forest-900/30 border-l-4 border-forest-500 p-4 rounded-r-lg">
                <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed italic">{entry.passage}</p>
              </div>
            </div>

            {/* Key Verse */}
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2 block">🔑 Key Verse — {entry.keyVerse}</p>
              <div className="bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">"{entry.keyVerseText}"</p>
              </div>
            </div>

            {/* Principle */}
            <div>
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">💡 Principle — Timeless Truth for Church Planting</p>
              <div className="bg-stone-50 dark:bg-stone-700 border-l-4 border-stone-400 dark:border-stone-500 p-4 rounded-r-lg">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{entry.principle}</p>
              </div>
            </div>

            {/* Practice */}
            <div>
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">✓ Practice — Today's Action Step</p>
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">{entry.practice}</p>
              </div>
              <Textarea
                id="je-practice-notes"
                value={entry.practiceNotes}
                onChange={setPracticeNotes}
                onInput={autoGrow}
                placeholder="Write how you will apply this today…"
                className="lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 leading-[2rem] pt-1 pb-0"
                style={WRITING_STYLE}
              />
            </div>

            {/* Praises */}
            <WritingField
              id="je-praises"
              label="🙌 Praises — What do I thank God for?"
              value={entry.praises}
              onChange={setPraises}
              placeholder="Express your gratitude based on today's passage..."
              testId="praises-input"
            />

            {/* Prayer */}
            <WritingField
              id="je-prayer"
              label="🙏 Prayer — My prayers for today"
              value={entry.prayer}
              onChange={setPrayer}
              placeholder="Pray the passage back to God, intercede for Timothys and Puerto Princesa..."
              testId="prayer-input"
            />
          </div>
        </Card>
      )}

      {/* ── FILES TAB ── */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">

          {/* Action button — full width, single action */}
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-forest-300 dark:border-forest-700 text-forest-600 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors text-sm font-medium"
            style={{ minHeight: 0 }}>
            <FileUp className="w-4 h-4" /> Save File
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleSaveFile} />

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center -mt-1">
            Supports PDF and Word (.doc, .docx) · Max 15 MB
          </p>

          {/* File viewer */}
          {activeFile && (
            <Card ref={fullscreenRef}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden"
              style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0, border: 'none' } : {}}>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate max-w-[60%] flex items-center gap-1.5">
                  <FileIcon name={activeFile.name} className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  {activeFile.name}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {activeFile.fileType === 'docx' && (
                    <div className="flex items-center gap-0.5 mr-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-0.5">
                      <button onClick={decFontSize}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm"
                        title="Decrease font size" style={{ minHeight: 0 }}>A−</button>
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-mono w-6 text-center">{docFontSize}</span>
                      <button onClick={incFontSize}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm"
                        title="Increase font size" style={{ minHeight: 0 }}>A+</button>
                    </div>
                  )}
                  <button onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{ minHeight: 0 }}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={closePdf}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 transition-colors"
                    title="Close" style={{ minHeight: 0 }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewer */}
              {activeFile.fileType === 'pdf' ? (
                <iframe src={activeFile.dataUrl} title={activeFile.name} className="w-full"
                  style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '70vh', border: 'none', display: 'block' }} />
              ) : (
                <div style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '70vh', overflowY: 'auto' }}>
                  <DocxViewer dataUrl={activeFile.dataUrl} fontSize={docFontSize} />
                </div>
              )}
            </Card>
          )}

          {/* Saved files list */}
          {savedFiles.length > 0 && (
            <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
              <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm mb-3">
                Saved Files ({savedFiles.length})
              </h3>
              <div className="space-y-2">
                {savedFiles.map(file => {
                  const isActive = activeFile?.dataUrl === file.dataUrl;
                  return (
                    <div key={file.id} onClick={() => openSaved(file)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-forest-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 border border-transparent'
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-forest-100 dark:bg-forest-900/50' : 'bg-stone-100 dark:bg-stone-700'
                      }`}>
                        <FileIcon name={file.name}
                          className={`w-4 h-4 ${isActive ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{file.name}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {fmtSize(file.size)} · {new Date(file.savedAt).toLocaleDateString()}
                          <span className="ml-1.5 uppercase tracking-wide font-semibold">
                            · {isPdf(file.name) ? 'PDF' : 'DOC'}
                          </span>
                        </p>
                      </div>
                      <button onClick={(e) => handleDeleteFile(file.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0"
                        style={{ minHeight: 0 }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {savedFiles.length === 0 && !activeFile && (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No files saved yet</p>
              <p className="text-xs mt-1">Save a PDF or Word doc to access it anytime</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntry;