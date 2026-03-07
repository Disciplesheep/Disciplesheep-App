import React, { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  BookOpen, FileText, FolderOpen, Heart, CheckCircle2, Clock,
  Plus, Trash2, CheckCheck, RotateCcw, Calendar, Tag,
  Maximize2, Minimize2, X, FileType2, AlertCircle, Filter,
  Star, Flame, Users, Home, Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

/* ── Constants ───────────────────────────────────────────────────────────── */
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 32;

const TABS = [
  { id: 'requests', icon: Flame,    label: 'Prayers'  },
  { id: 'praises',  icon: Star,     label: 'Praises'  },
  { id: 'files',    icon: FileText, label: 'Files'    },
];

const CATEGORIES = [
  { id: 'all',          label: 'All',          icon: Filter  },
  { id: 'personal',     label: 'Personal',     icon: Heart   },
  { id: 'family',       label: 'Family',       icon: Home    },
  { id: 'timothy',      label: 'Timothys',     icon: Users   },
  { id: 'church',       label: 'Church',       icon: BookOpen },
  { id: 'community',    label: 'Community',    icon: Globe   },
];

const CAT_COLORS = {
  personal:  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  family:    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  timothy:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  church:    'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400',
  community: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const isPdf  = (name) => name?.toLowerCase().endsWith('.pdf');
const isDocx = (name) => !!name?.toLowerCase().match(/\.docx?$/);
const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const today   = () => new Date().toISOString().split('T')[0];
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';

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
  const [html, setHtml]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
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
      <Clock className="w-5 h-5 animate-spin mr-2" /> Converting…
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-40 gap-2 text-red-400 text-sm p-4">
      <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
    </div>
  );
  return (
    <div className="prose prose-stone dark:prose-invert max-w-none p-6 overflow-y-auto"
      style={{ fontFamily:'Georgia, serif', lineHeight: Math.max(1.3, 1.9-(fontSize-12)*0.03), fontSize:`${fontSize}px` }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
};

/* ── Add Prayer Request Modal ────────────────────────────────────────────── */
const AddRequestModal = ({ onSave, onClose }) => {
  const [text,     setText]     = useState('');
  const [category, setCategory] = useState('personal');
  const [dateAdded, setDateAdded] = useState(today());
  const [person,   setPerson]   = useState('');

  const handleSave = () => {
    if (!text.trim()) { toast.error('Please enter a prayer request.'); return; }
    onSave({
      id:        Date.now().toString(),
      text:      text.trim(),
      person:    person.trim(),
      category,
      dateAdded,
      answered:  false,
      dateAnswered: null,
      praise:    '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-white">New Prayer Request</h2>
          <p className="text-white/80 text-xs mt-0.5">Bring it before the Lord</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Person / Name */}
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Person / Topic <span className="normal-case font-normal">(optional)</span>
            </label>
            <input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="e.g. Juan, our church plant, Puerto Princesa…"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 dark:focus:border-rose-500 transition-colors placeholder:text-stone-400"
            />
          </div>

          {/* Request */}
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Prayer Request</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Write your prayer request…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 dark:focus:border-rose-500 transition-colors placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat.id
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Started</label>
            <input type="date" value={dateAdded} onChange={e => setDateAdded(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-rose-400 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Mark Answered Modal ─────────────────────────────────────────────────── */
const MarkAnsweredModal = ({ request, onSave, onClose }) => {
  const [dateAnswered, setDateAnswered] = useState(today());
  const [praise,       setPraise]       = useState('');

  const handleSave = () => {
    onSave({ dateAnswered, praise: praise.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="bg-gradient-to-r from-forest-500 to-emerald-500 px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-white">🙌 Prayer Answered!</h2>
          <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{request.person ? `${request.person} — ` : ''}{request.text}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Answered</label>
            <input type="date" value={dateAnswered} onChange={e => setDateAnswered(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Praise Note <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea value={praise} onChange={e => setPraise(e.target.value)}
              placeholder="How did God answer this prayer?"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors placeholder:text-stone-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Mark as Answered
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Prayer Request Card ─────────────────────────────────────────────────── */
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
        {/* Status dot */}
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

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {!req.answered ? (
            <button onClick={() => onMarkAnswered(req)}
              title="Mark as answered"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 dark:hover:bg-forest-900/50 text-forest-600 dark:text-forest-400 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => onUnmark(req.id)}
              title="Move back to ongoing"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-400 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(req.id)}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────── */
const PrayerJournal = () => {
  const [requests,   setRequests]   = useLocalStorage('prayerRequests', []);
  const [savedFiles, setSavedFiles] = useLocalStorage('prayerFiles', []);

  const [activeTab,    setActiveTab]    = useState('requests');
  const [filterCat,    setFilterCat]    = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [markTarget,   setMarkTarget]   = useState(null);

  // File viewer state
  const [activeFile,   setActiveFile]   = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docFontSize,  setDocFontSize]  = useState(16);
  const fileInputRef  = useRef();
  const fullscreenRef = useRef();

  /* ── Prayer request actions ── */
  const handleAddRequest = useCallback((req) => {
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

  /* ── File actions ── */
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
    if (activeFile?.dataUrl === file?.dataUrl) { setActiveFile(null); setIsFullscreen(false); }
    toast.success('File removed');
  }, [savedFiles, activeFile, setSavedFiles]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) fullscreenRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
    setIsFullscreen(v => !v);
  }, [isFullscreen]);

  React.useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── Derived data ── */
  const ongoing  = requests.filter(r => !r.answered);
  const answered = requests.filter(r => r.answered);

  const filtered = (list) =>
    filterCat === 'all' ? list : list.filter(r => r.category === filterCat);

  /* ── Stats ── */
  const stats = [
    { label: 'Ongoing',  value: ongoing.length,  color: 'text-rose-500'    },
    { label: 'Answered', value: answered.length,  color: 'text-forest-500'  },
    { label: 'Total',    value: requests.length,  color: 'text-stone-600 dark:text-stone-300' },
  ];

  return (
    <>
      {/* Modals */}
      {showAddModal && (
        <AddRequestModal onSave={handleAddRequest} onClose={() => setShowAddModal(false)} />
      )}
      {markTarget && (
        <MarkAnsweredModal
          request={markTarget}
          onSave={handleMarkAnswered}
          onClose={() => setMarkTarget(null)}
        />
      )}

      <div className="space-y-4 pb-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #be123c 0%, #d97706 60%, #15803d 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight">Prayer Journal</h1>
                <p className="text-white/75 text-xs mt-0.5">Requests · Answered · Praises</p>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium backdrop-blur-sm transition-all border border-white/20">
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
            {/* Stats */}
            <div className="flex gap-4">
              {stats.map(s => (
                <div key={s.label} className="text-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-xl font-bold font-serif">{s.value}</p>
                  <p className="text-white/70 text-[10px] uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

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

        {/* ── REQUESTS TAB ── */}
        {activeTab === 'requests' && (
          <div className="space-y-4">

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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

            {/* Ongoing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  Ongoing Prayers
                  <span className="ml-2 text-xs font-normal text-stone-400">({filtered(ongoing).length})</span>
                </h3>
              </div>

              {filtered(ongoing).length > 0 ? (
                <div className="space-y-2">
                  {filtered(ongoing).map(req => (
                    <RequestCard key={req.id} req={req}
                      onMarkAnswered={setMarkTarget}
                      onDelete={handleDelete}
                      onUnmark={handleUnmark}
                    />
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
            </div>

            {/* Divider */}
            {filtered(answered).length > 0 && (
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-stone-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-stone-50 dark:bg-stone-900 px-3 text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-widest">
                    Answered Prayers
                  </span>
                </div>
              </div>
            )}

            {/* Answered (shown inline too) */}
            {filtered(answered).length > 0 && (
              <div className="space-y-2">
                {filtered(answered).map(req => (
                  <RequestCard key={req.id} req={req}
                    onMarkAnswered={setMarkTarget}
                    onDelete={handleDelete}
                    onUnmark={handleUnmark}
                  />
                ))}
              </div>
            )}

            {/* FAB */}
            <button onClick={() => setShowAddModal(true)}
              className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #be123c, #d97706)' }}>
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ── PRAISES TAB ── */}
        {activeTab === 'praises' && (
          <div className="space-y-4">

            {answered.length === 0 ? (
              <div className="text-center py-16 text-stone-400 dark:text-stone-500">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No answered prayers yet</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  When you mark a prayer request as answered, it will appear here as a praise testimony.
                </p>
              </div>
            ) : (
              <>
                {/* Praise header */}
                <Card className="bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-900/20 dark:to-emerald-900/20 border border-forest-200 dark:border-forest-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-400" />
                    </div>
                    <div>
                      <p className="font-serif font-semibold text-forest-900 dark:text-forest-100">
                        {answered.length} Answered {answered.length === 1 ? 'Prayer' : 'Prayers'}
                      </p>
                      <p className="text-xs text-forest-700 dark:text-forest-400">
                        "He who calls you is faithful; he will surely do it." — 1 Thess 5:24
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  {answered.map((req, idx) => {
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
                                <p className="text-xs font-bold text-forest-700 dark:text-forest-400 uppercase tracking-widest mb-1">🙌 Praise</p>
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
          </div>
        )}

        {/* ── FILES TAB ── */}
        {activeTab === 'files' && (
          <div className="space-y-4">

            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-sm font-medium"
              style={{ minHeight: 0 }}>
              <FolderOpen className="w-4 h-4" /> Open a File
            </button>
            <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleSaveFile} />

            <p className="text-xs text-stone-400 dark:text-stone-500 text-center -mt-1">
              Supports PDF and Word (.doc, .docx) · Max 15 MB
            </p>

            {/* File viewer */}
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
                        <button onClick={() => setDocFontSize(s => Math.max(FONT_SIZE_MIN, s-2))}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm" style={{ minHeight:0 }}>A−</button>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-mono w-6 text-center">{docFontSize}</span>
                        <button onClick={() => setDocFontSize(s => Math.min(FONT_SIZE_MAX, s+2))}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 font-bold transition-colors text-sm" style={{ minHeight:0 }}>A+</button>
                      </div>
                    )}
                    <button onClick={toggleFullscreen}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors" style={{ minHeight:0 }}>
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setActiveFile(null); setIsFullscreen(false); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 transition-colors" style={{ minHeight:0 }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeFile.fileType === 'pdf' ? (
                  <iframe src={activeFile.dataUrl} title={activeFile.name} className="w-full"
                    style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '70vh', border:'none', display:'block' }} />
                ) : (
                  <div style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '70vh', overflowY:'auto' }}>
                    <DocxViewer dataUrl={activeFile.dataUrl} fontSize={docFontSize} />
                  </div>
                )}
              </Card>
            )}

            {/* Saved files */}
            {savedFiles.length > 0 && (
              <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
                <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm mb-3">
                  Saved Files ({savedFiles.length})
                </h3>
                <div className="space-y-2">
                  {savedFiles.map(file => {
                    const isActive = activeFile?.dataUrl === file.dataUrl;
                    return (
                      <div key={file.id} onClick={() => setActiveFile({ name:file.name, dataUrl:file.dataUrl, fileType:file.fileType })}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 border border-transparent'
                        }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-stone-100 dark:bg-stone-700'}`}>
                          <FileIcon name={file.name} className={`w-4 h-4 ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-stone-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{file.name}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {fmtSize(file.size)} · {new Date(file.savedAt).toLocaleDateString()}
                            <span className="ml-1.5 uppercase tracking-wide font-semibold">· {isPdf(file.name) ? 'PDF' : 'DOC'}</span>
                          </p>
                        </div>
                        <button onClick={(e) => handleDeleteFile(file.id, e)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0" style={{ minHeight:0 }}>
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
    </>
  );
};

export default PrayerJournal;