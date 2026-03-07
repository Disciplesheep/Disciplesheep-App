import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useJournalData, useLocalStorage } from '@/hooks/useLocalStorage';
import {
  CheckCircle2, Clock, BookOpen, FileText, FolderOpen, Maximize2, Minimize2,
  Trash2, X, FileType2, AlertCircle, Plus, CheckCheck,
  RotateCcw, Calendar, Star, Flame, Heart, Home, Users, Globe, Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/utils/dateUtils';
import { getDevotionalForDate } from '@/data/dailyDevotionals';
import { toast } from 'sonner';

/* ── Constants ───────────────────────────────────────────────────────────── */
const ACCEPT        = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 32;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/* Tab definitions — used for the right-side FABs */
const TABS = [
  { id: 'devotional', Icon: BookOpen,  label: "5P's",   color: 'bg-forest-500 hover:bg-forest-700', shadow: 'shadow-forest-900/30' },
  { id: 'prayer',     Icon: () => (
    <svg viewBox="0 0 36 36" className="w-6 h-6" fill="currentColor">
      {/* Right hand fingers */}
      <path fill="#F7DECE" d="M27.3 7.2c-.7-.7-1.8-.7-2.5 0l-5.6 5.6V9.5c0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8v8.3l-1.2-1.2c-.7-.7-1.8-.7-2.5 0s-.7 1.8 0 2.5l5.5 5.5c.7 2.2 2.7 3.7 5.1 3.7 3 0 5.4-2.4 5.4-5.4V9.7c0-1-.8-1.8-1.8-1.8-.4 0-.8.2-1.1.4.1-.3.2-.7.2-1.1 0-.5-.2-1-.9-1z"/>
      {/* Left hand fingers */}
      <path fill="#EEC2AD" d="M8.7 7.2c.7-.7 1.8-.7 2.5 0l5.6 5.6V9.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v8.3l1.2-1.2c.7-.7 1.8-.7 2.5 0s.7 1.8 0 2.5l-5.5 5.5c-.7 2.2-2.7 3.7-5.1 3.7-3 0-5.4-2.4-5.4-5.4V9.7c0-1 .8-1.8 1.8-1.8.4 0 .8.2 1.1.4C10 8 9.9 7.6 9.9 7.2c0-.5.2-1 .9-1-.7 0-1.4.3-2.1 1z"/>
      {/* Palms base */}
      <path fill="#F7DECE" d="M18 13.5v10.8c.6.5 1.3.8 2 1V13.5H18z"/>
      <path fill="#EEC2AD" d="M18 13.5v10.8c-.6.5-1.3.8-2 1V13.5H18z"/>
    </svg>
  ), label: 'Prayer', color: 'bg-rose-600 hover:bg-rose-700',     shadow: 'shadow-rose-900/30'   },
  { id: 'pdf',        Icon: FileText,  label: 'Files',  color: 'bg-stone-600 hover:bg-stone-700',   shadow: 'shadow-stone-900/30'  },
];

const WRITING_STYLE = {
  minHeight: '128px',
  height: 'auto',
  overflow: 'hidden',
  resize: 'none',
};

/* ── Prayer categories ───────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: Filter   },
  { id: 'personal',  label: 'Personal',  icon: Heart    },
  { id: 'family',    label: 'Family',    icon: Home     },
  { id: 'timothy',   label: 'Timothys',  icon: Users    },
  { id: 'church',    label: 'Church',    icon: BookOpen },
  { id: 'community', label: 'Community', icon: Globe    },
];

const CAT_COLORS = {
  personal:  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  family:    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  timothy:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  church:    'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400',
  community: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const isPdf   = (name) => name?.toLowerCase().endsWith('.pdf');
const isDocx  = (name) => !!name?.toLowerCase().match(/\.docx?$/);
const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const todayIso = () => new Date().toISOString().split('T')[0];
const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';

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
  praises:       saved.praises       || '',
  prayer:        saved.prayer        || '',
  tasks:         saved.tasks         || [],
});

/* ── Lazy mammoth ────────────────────────────────────────────────────────── */
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

/* ── FileIcon ────────────────────────────────────────────────────────────── */
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
    <div className="prose prose-stone dark:prose-invert max-w-none p-6 overflow-y-auto"
      style={{ fontFamily:'Georgia, serif', lineHeight:Math.max(1.3,1.9-(fontSize-12)*0.03), fontSize:`${fontSize}px` }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
};

/* ── WritingField ────────────────────────────────────────────────────────── */
const WritingField = React.memo(({ id, label, value, onChange, onFocus, onBlur, placeholder, testId }) => (
  <div>
    <Label htmlFor={id} className="text-xs uppercase tracking-widest text-mango-500 dark:text-mango-400 font-bold mb-2 block">
      {label}
    </Label>
    <Textarea id={id} value={value} onChange={onChange} onInput={autoGrow} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
      className="lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 leading-[2rem] pt-1 pb-0"
      style={WRITING_STYLE} data-testid={testId} />
  </div>
));
WritingField.displayName = 'WritingField';

/* ═══════════════════════════════════════════════════════════════════════════
   PRAYER SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

const AddRequestModal = ({ onSave, onClose }) => {
  const [text,      setText]      = useState('');
  const [category,  setCategory]  = useState('personal');
  const [dateAdded, setDateAdded] = useState(todayIso());
  const [person,    setPerson]    = useState('');

  const handleSave = () => {
    if (!text.trim()) { toast.error('Please enter a prayer request.'); return; }
    onSave({
      id: Date.now().toString(),
      text: text.trim(),
      person: person.trim(),
      category,
      dateAdded,
      answered: false,
      dateAnswered: null,
      praise: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="px-5 py-4" style={{ background:'linear-gradient(135deg,#be123c,#d97706)' }}>
          <h2 className="font-serif text-lg font-bold text-white">New Prayer Request</h2>
          <p className="text-white/80 text-xs mt-0.5">Bring it before the Lord</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Person / Topic <span className="normal-case font-normal">(optional)</span>
            </label>
            <input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="e.g. Juan, our church plant, Puerto Princesa…"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 transition-colors placeholder:text-stone-400" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Prayer Request</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Write your prayer request…" rows={3}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 transition-colors placeholder:text-stone-400 resize-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat.id ? 'bg-rose-500 text-white shadow-sm' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Started</label>
            <input type="date" value={dateAdded} onChange={e => setDateAdded(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 transition-colors" />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background:'linear-gradient(135deg,#be123c,#d97706)' }}>
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};

const MarkAnsweredModal = ({ request, onSave, onClose }) => {
  const [dateAnswered, setDateAnswered] = useState(todayIso());
  const [praise,       setPraise]       = useState('');

  const handleSave = () => { onSave({ dateAnswered, praise: praise.trim() }); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="px-5 py-4" style={{ background:'linear-gradient(135deg,#15803d,#059669)' }}>
          <h2 className="font-serif text-lg font-bold text-white">🙌 Prayer Answered!</h2>
          <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
            {request.person ? `${request.person} — ` : ''}{request.text}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Answered</label>
            <input type="date" value={dateAnswered} onChange={e => setDateAnswered(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Praise Note <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea value={praise} onChange={e => setPraise(e.target.value)}
              placeholder="How did God answer this prayer?" rows={3}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors placeholder:text-stone-400 resize-none" />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background:'linear-gradient(135deg,#15803d,#059669)' }}>
            Mark as Answered
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ req, onMarkAnswered, onDelete, onUnmark }) => {
  const catColor = CAT_COLORS[req.category] || CAT_COLORS.personal;
  const catLabel = CATEGORIES.find(c => c.id === req.category)?.label || req.category;
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      req.answered
        ? 'bg-forest-50/50 dark:bg-forest-900/10 border-forest-200 dark:border-forest-800'
        : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${req.answered ? 'bg-forest-500' : 'bg-rose-400 animate-pulse'}`} />
        <div className="flex-1 min-w-0">
          {req.person && (
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">{req.person}</p>
          )}
          <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">{req.text}</p>
          {req.answered && req.praise && (
            <div className="mt-2 pl-3 border-l-2 border-forest-400">
              <p className="text-xs text-forest-700 dark:text-forest-400 italic leading-relaxed">"{req.praise}"</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {fmtDate(req.dateAdded)}
            </span>
            {req.answered && req.dateAnswered && (
              <span className="text-[10px] text-forest-600 dark:text-forest-400 flex items-center gap-1 font-medium">
                <CheckCheck className="w-3 h-3" /> Answered {fmtDate(req.dateAnswered)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!req.answered ? (
            <button onClick={() => onMarkAnswered(req)} title="Mark as answered"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 dark:hover:bg-forest-900/50 text-forest-600 dark:text-forest-400 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => onUnmark(req.id)} title="Move back to ongoing"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-400 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(req.id)} title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PrayerPanel = () => {
  const [requests,     setRequests]     = useLocalStorage('prayerRequests', []);
  const [filterCat,    setFilterCat]    = useState('all');
  const [prayerView,   setPrayerView]   = useState('ongoing');
  const [showAddModal, setShowAddModal] = useState(false);
  const [markTarget,   setMarkTarget]   = useState(null);

  const handleAddRequest  = useCallback((req) => {
    setRequests(prev => [req, ...prev]);
    toast.success('Prayer request added 🙏');
  }, [setRequests]);

  const handleMarkAnswered = useCallback(({ dateAnswered, praise }) => {
    setRequests(prev => prev.map(r =>
      r.id === markTarget.id ? { ...r, answered: true, dateAnswered, praise } : r
    ));
    toast.success('Praise God — marked as answered! 🙌');
  }, [markTarget, setRequests]);

  const handleUnmark = useCallback((id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, answered: false, dateAnswered: null, praise: '' } : r));
    toast('Moved back to ongoing');
  }, [setRequests]);

  const handleDelete = useCallback((id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success('Removed');
  }, [setRequests]);

  const ongoing  = requests.filter(r => !r.answered);
  const answered = requests.filter(r =>  r.answered);
  const filtered = (list) => filterCat === 'all' ? list : list.filter(r => r.category === filterCat);

  return (
    <>
      {showAddModal && <AddRequestModal onSave={handleAddRequest} onClose={() => setShowAddModal(false)} />}
      {markTarget   && (
        <MarkAnsweredModal request={markTarget}
          onSave={handleMarkAnswered}
          onClose={() => setMarkTarget(null)} />
      )}

      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background:'linear-gradient(135deg,#be123c 0%,#d97706 60%,#15803d 100%)' }}>
          <div>
            <h2 className="font-serif text-xl font-bold text-white">Prayer Journal</h2>
            <p className="text-white/70 text-xs mt-0.5">Requests · Answered · Praises</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="text-center bg-white/15 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                <p className="text-sm font-bold text-white font-serif">{ongoing.length}</p>
                <p className="text-white/70 text-[9px] uppercase tracking-widest">Ongoing</p>
              </div>
              <div className="text-center bg-white/15 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                <p className="text-sm font-bold text-white font-serif">{answered.length}</p>
                <p className="text-white/70 text-[9px] uppercase tracking-widest">Answered</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all border border-white/20 backdrop-blur-sm"
              title="New prayer request">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-3 bg-stone-50 dark:bg-stone-900/30 border-b border-stone-100 dark:border-stone-700">
          <button onClick={() => setPrayerView('ongoing')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              prayerView === 'ongoing'
                ? 'bg-white dark:bg-stone-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
            }`}>
            <Flame className="w-3.5 h-3.5" /> Ongoing ({ongoing.length})
          </button>
          <button onClick={() => setPrayerView('praises')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              prayerView === 'praises'
                ? 'bg-white dark:bg-stone-700 text-forest-600 dark:text-forest-400 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
            }`}>
            <Star className="w-3.5 h-3.5" /> Praises ({answered.length})
          </button>
        </div>

        <div className="p-4 space-y-3">
          {prayerView === 'ongoing' && (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                      filterCat === cat.id
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}>
                    <cat.icon className="w-3 h-3" />{cat.label}
                  </button>
                ))}
              </div>

              {filtered(ongoing).length > 0 ? (
                <div className="space-y-2">
                  {filtered(ongoing).map(req => (
                    <RequestCard key={req.id} req={req}
                      onMarkAnswered={setMarkTarget}
                      onDelete={handleDelete}
                      onUnmark={handleUnmark} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 dark:text-stone-500">
                  <Flame className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No ongoing prayer requests</p>
                  <button onClick={() => setShowAddModal(true)}
                    className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-medium">
                    + Add one
                  </button>
                </div>
              )}

              {filtered(answered).length > 0 && (
                <>
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200 dark:border-stone-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-stone-800 px-3 text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-widest">
                        Answered
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filtered(answered).map(req => (
                      <RequestCard key={req.id} req={req}
                        onMarkAnswered={setMarkTarget}
                        onDelete={handleDelete}
                        onUnmark={handleUnmark} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {prayerView === 'praises' && (
            <>
              {answered.length === 0 ? (
                <div className="text-center py-12 text-stone-400 dark:text-stone-500">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No answered prayers yet</p>
                  <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                    When a prayer is answered, mark it and it will appear here as a praise testimony.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800">
                    <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-400 shrink-0" />
                    <p className="text-xs text-forest-800 dark:text-forest-300 italic leading-relaxed">
                      "He who calls you is faithful; he will surely do it." — 1 Thess 5:24
                    </p>
                  </div>
                  <div className="space-y-3">
                    {answered.map(req => {
                      const catColor = CAT_COLORS[req.category] || CAT_COLORS.personal;
                      const catLabel = CATEGORIES.find(c => c.id === req.category)?.label || req.category;
                      return (
                        <div key={req.id} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center shrink-0 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {req.person && (
                                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">{req.person}</p>
                              )}
                              <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">{req.text}</p>
                              {req.praise && (
                                <div className="mt-2.5 p-3 rounded-lg bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800">
                                  <p className="text-[10px] font-bold text-forest-700 dark:text-forest-400 uppercase tracking-widest mb-1">🙌 Praise</p>
                                  <p className="text-sm text-forest-800 dark:text-forest-300 italic leading-relaxed">"{req.praise}"</p>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
                                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Started {fmtDate(req.dateAdded)}
                                </span>
                                <span className="text-[10px] text-forest-600 dark:text-forest-400 flex items-center gap-1 font-medium">
                                  <CheckCheck className="w-3 h-3" /> Answered {fmtDate(req.dateAnswered)}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => handleDelete(req.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN JOURNAL ENTRY COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const JournalEntry = () => {
  const { journalDate: selectedDate } = useOutletContext();
  const dateKey    = formatDate(selectedDate);
  const { dailyEntries, setDailyEntries } = useJournalData();
  const devotional = useMemo(() => getDevotionalForDate(dateKey), [dateKey]);

  const [entry,      setEntry]      = useState(() => buildEntry(devotional, dailyEntries[dateKey]));
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeTab,  setActiveTab]  = useState('devotional');

  /* ── FAB visibility (hide-on-scroll + hide-while-field-focused) ── */
  const [fabVisible,     setFabVisible]     = useState(true);
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const scrollTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setFabVisible(false);
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setFabVisible(true), 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(scrollTimer.current); };
  }, []);

  const handleFieldFocus = useCallback(() => setIsFieldFocused(true),  []);
  const handleFieldBlur  = useCallback(() => setIsFieldFocused(false), []);

  // Rebuild when date changes
  useEffect(() => {
    setEntry(buildEntry(getDevotionalForDate(dateKey), dailyEntries[dateKey]));
    setSaveStatus('saved');
  }, [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save
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

  // Stable setters
  const setPracticeNotes = useCallback((e) => setEntry(prev => ({ ...prev, practiceNotes: e.target.value })), []);
  const setPraises       = useCallback((e) => setEntry(prev => ({ ...prev, praises: e.target.value })), []);
  const setPrayer        = useCallback((e) => setEntry(prev => ({ ...prev, prayer:  e.target.value })), []);

  // File state
  const [savedFiles,   setSavedFiles]   = useLocalStorage('savedPdfs', []);
  const [activeFile,   setActiveFile]   = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docFontSize,  setDocFontSize]  = useState(32);
  const fileInputRef  = useRef();
  const fullscreenRef = useRef();

  const decFontSize = useCallback(() => setDocFontSize(s => Math.max(FONT_SIZE_MIN, s - 2)), []);
  const incFontSize = useCallback(() => setDocFontSize(s => Math.min(FONT_SIZE_MAX, s + 2)), []);
  const closePdf    = useCallback(() => { setActiveFile(null); setIsFullscreen(false); }, []);
  const openSaved   = useCallback((file) => {
    setActiveFile({ name:file.name, dataUrl:file.dataUrl, fileType:file.fileType || (isPdf(file.name)?'pdf':'docx') });
  }, []);

  const readFile = useCallback((file, onReady) => {
    if (!file) return;
    const valid = file.type.includes('pdf') || file.type.includes('word') || isPdf(file.name) || isDocx(file.name);
    if (!valid) { toast.error('Please select a PDF or Word (.docx) file'); return; }
    if (file.size > MAX_FILE_BYTES) { toast.error('File too large (max 15 MB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onReady(ev.target.result, isPdf(file.name) ? 'pdf' : 'docx');
    reader.readAsDataURL(file);
  }, []);

  const handleSaveFile = useCallback((e) => {
    const file = e.target.files[0];
    readFile(file, (dataUrl, fileType) => {
      const newFile = { id:Date.now().toString(), name:file.name, size:file.size, fileType, dataUrl, savedAt:new Date().toISOString() };
      setSavedFiles(prev => [newFile, ...prev]);
      setActiveFile({ name:file.name, dataUrl, fileType });
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

  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (activeFile) window.history.pushState({ fileOpen: true }, '');
  }, [activeFile]);

  useEffect(() => {
    const onPopState = () => { if (activeFile) closePdf(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeFile, closePdf]);

  /* ── Tab switch: clicking the active tab goes back to devotional ── */
  const handleTabClick = (id) => {
    setActiveTab(prev => (prev === id && id !== 'devotional') ? 'devotional' : id);
  };

  /* ── Render ── */
  return (
    <div className="space-y-4 pb-6">

      {/* ── Right-side FABs — matches ExpenseLedger positioning ── */}
      <div className={`fixed right-16 top-[74%] z-40 flex flex-col gap-6 items-center transition-all duration-150 ${
        fabVisible && !isFieldFocused ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'
      }`}>
        {TABS.filter(({ id }) => id !== activeTab).map(({ id, Icon, label, color, shadow }) => (
          <button key={id} onClick={() => handleTabClick(id)} title={label}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${color} shadow-${shadow}`}>
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>

      {/* ── 5P's DEVOTIONAL ── */}
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
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">📖 Passage (NASB)</p>
              <div className="bg-forest-50/50 dark:bg-forest-900/30 border-l-4 border-forest-500 p-4 rounded-r-lg">
                <p className="font-serif text-base text-stone-800 dark:text-stone-200 leading-relaxed italic">{entry.passage}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2 block">🔑 Key Verse — {entry.keyVerse}</p>
              <div className="bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">"{entry.keyVerseText}"</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">💡 Principle — Timeless Truth for Church Planting</p>
              <div className="bg-stone-50 dark:bg-stone-700 border-l-4 border-stone-400 dark:border-stone-500 p-4 rounded-r-lg">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{entry.principle}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-forest-700 dark:text-forest-400 font-bold mb-2 block">✓ Practice — Today's Action Step</p>
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">{entry.practice}</p>
              </div>
              <Textarea id="je-practice-notes" value={entry.practiceNotes} onChange={setPracticeNotes} onInput={autoGrow} onFocus={handleFieldFocus} onBlur={handleFieldBlur}
                placeholder="Write how you will apply this today…"
                className="lined-paper bg-transparent border-none focus:ring-0 text-base font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 leading-[2rem] pt-1 pb-0"
                style={WRITING_STYLE} />
            </div>
            <WritingField id="je-praises" label="🙌 Praises — What do I thank God for?"
              value={entry.praises} onChange={setPraises} onFocus={handleFieldFocus} onBlur={handleFieldBlur}
              placeholder="Express your gratitude based on today's passage..."
              testId="praises-input" />
            <WritingField id="je-prayer" label="🙏 Prayer — My prayers for today"
              value={entry.prayer} onChange={setPrayer} onFocus={handleFieldFocus} onBlur={handleFieldBlur}
              placeholder="Pray the passage back to God, intercede for Timothys and Puerto Princesa..."
              testId="prayer-input" />
          </div>
        </Card>
      )}

      {/* ── PRAYER TAB ── */}
      {activeTab === 'prayer' && <PrayerPanel />}

      {/* ── FILES TAB ── */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-forest-300 dark:border-forest-700 text-forest-600 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors text-sm font-medium"
            style={{ minHeight:0 }}>
            <FolderOpen className="w-4 h-4" /> Open a File
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleSaveFile} />
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center -mt-1">
            Supports PDF and Word (.doc, .docx) · Max 15 MB
          </p>

          {activeFile && (
            <Card ref={fullscreenRef}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden"
              style={isFullscreen ? { position:'fixed', inset:0, zIndex:9999, borderRadius:0, border:'none' } : {}}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate max-w-[60%] flex items-center gap-1.5">
                  <FileIcon name={activeFile.name} className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  {activeFile.name}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {activeFile.fileType === 'docx' && (
                    <div className="flex items-center gap-0.5 mr-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-0.5">
                      <button onClick={decFontSize} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm" style={{ minHeight:0 }}>A−</button>
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-mono w-6 text-center">{docFontSize}</span>
                      <button onClick={incFontSize} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm" style={{ minHeight:0 }}>A+</button>
                    </div>
                  )}
                  <button onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{ minHeight:0 }}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={closePdf}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 transition-colors"
                    title="Close" style={{ minHeight:0 }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {activeFile.fileType === 'pdf' ? (
                <iframe src={activeFile.dataUrl} title={activeFile.name} className="w-full"
                  style={{ height:isFullscreen?'calc(100vh - 48px)':'70vh', border:'none', display:'block' }} />
              ) : (
                <div style={{ height:isFullscreen?'calc(100vh - 48px)':'70vh', overflowY:'auto' }}>
                  <DocxViewer dataUrl={activeFile.dataUrl} fontSize={docFontSize} />
                </div>
              )}
            </Card>
          )}

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
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-forest-100 dark:bg-forest-900/50' : 'bg-stone-100 dark:bg-stone-700'}`}>
                        <FileIcon name={file.name} className={`w-4 h-4 ${isActive ? 'text-forest-600 dark:text-forest-400' : 'text-stone-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{file.name}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {fmtSize(file.size)} · {new Date(file.savedAt).toLocaleDateString()}
                          <span className="ml-1.5 uppercase tracking-wide font-semibold">· {isPdf(file.name) ? 'PDF' : 'DOC'}</span>
                        </p>
                      </div>
                      <button onClick={(e) => handleDeleteFile(file.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0"
                        style={{ minHeight:0 }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {savedFiles.length === 0 && !activeFile && (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No files saved yet</p>
              <p className="text-xs mt-1">Open a PDF or Word doc to access it anytime</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntry;