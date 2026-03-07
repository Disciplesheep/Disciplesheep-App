import React, { useState, useRef, useCallback } from 'react';
import {
  BookOpen, FileText, FolderOpen, Heart, CheckCircle2, Clock,
  Plus, Trash2, CheckCheck, RotateCcw, Calendar, Tag,
  Maximize2, Minimize2, X, FileType2, AlertCircle, Filter,
  Star, Flame, Users, Home, Globe, ChevronDown, ChevronUp,
  Search, Pencil, Cross, Church
} from 'lucide-react';

/* ── Storage hook ────────────────────────────────────────────────────────── */
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback(fn => {
    setVal(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const isPdf  = (name) => name?.toLowerCase().endsWith('.pdf');
const isDocx = (name) => !!name?.toLowerCase().match(/\.docx?$/);

/* ── Prayer Item Templates per category ─────────────────────────────────── */
const PRAYER_ITEMS = {
  personal: [
    { key: 'salvation',   label: 'Salvation / Faith Journey' },
    { key: 'health',      label: 'Physical / Mental Health'  },
    { key: 'spiritual',   label: 'Spiritual Growth'          },
    { key: 'provision',   label: 'Daily Provision & Needs'   },
    { key: 'guidance',    label: 'Guidance & Decisions'      },
    { key: 'struggles',   label: 'Personal Struggles'        },
    { key: 'gratitude',   label: 'Gratitude Items'           },
  ],
  family: [
    { key: 'unity',       label: 'Family Unity & Harmony'    },
    { key: 'salvation',   label: 'Salvation of Family'       },
    { key: 'health',      label: 'Health & Protection'       },
    { key: 'children',    label: 'Children / Youth'          },
    { key: 'marriage',    label: 'Marriage / Relationships'  },
    { key: 'provision',   label: 'Financial Provision'       },
  ],
  timothy: [
    { key: 'discipleship',label: 'Discipleship Growth'       },
    { key: 'calling',     label: 'Calling & Purpose'         },
    { key: 'character',   label: 'Character Development'     },
    { key: 'community',   label: 'Gospel Community'          },
    { key: 'struggles',   label: 'Struggles & Temptations'   },
    { key: 'ministry',    label: 'Ministry Opportunities'    },
  ],
  church: [
    { key: 'leadership',  label: 'Church Leadership'         },
    { key: 'unity',       label: 'Unity & Love'              },
    { key: 'outreach',    label: 'Evangelism & Outreach'     },
    { key: 'growth',      label: 'Spiritual Growth'          },
    { key: 'missions',    label: 'Missions & Church Plants'  },
    { key: 'provision',   label: 'Resources & Provision'     },
  ],
  community: [
    { key: 'leaders',     label: 'Local Leaders / Gov\'t'    },
    { key: 'lost',        label: 'The Lost / Unsaved'        },
    { key: 'poor',        label: 'The Poor & Marginalized'   },
    { key: 'peace',       label: 'Peace & Justice'           },
    { key: 'revival',     label: 'Revival & Awakening'       },
    { key: 'missionaries',label: 'Missionaries in the Field' },
  ],
};

const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: '🔥', color: '#6b7280', bg: '#f9fafb', accent: '#e5e7eb' },
  { id: 'personal',  label: 'Personal',  icon: '🙏', color: '#e11d48', bg: '#fff1f2', accent: '#fecdd3' },
  { id: 'family',    label: 'Family',    icon: '🏠', color: '#d97706', bg: '#fffbeb', accent: '#fde68a' },
  { id: 'timothy',   label: 'Timothys',  icon: '✝️', color: '#2563eb', bg: '#eff6ff', accent: '#bfdbfe' },
  { id: 'church',    label: 'Church',    icon: '⛪', color: '#7c3aed', bg: '#f5f3ff', accent: '#ddd6fe' },
  { id: 'community', label: 'Community', icon: '🌍', color: '#059669', bg: '#ecfdf5', accent: '#a7f3d0' },
];

const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[1];

/* ── Toast ───────────────────────────────────────────────────────────────── */
let _toastId = 0;
const ToastContext = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none" style={{width:'max-content',maxWidth:'90vw'}}>
        {toasts.map(t => (
          <div key={t.id} className="px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-lg"
            style={{
              background: t.type === 'error' ? '#ef4444' : t.type === 'info' ? '#6366f1' : '#10b981',
              animation: 'slideUp .25s ease',
            }}>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </ToastContext.Provider>
  );
}
const useToast = () => React.useContext(ToastContext);

/* ── Mammoth lazy loader ─────────────────────────────────────────────────── */
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

/* ── DocxViewer ──────────────────────────────────────────────────────────── */
const DocxViewer = ({ dataUrl, fontSize = 16 }) => {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setHtml('');
    (async () => {
      try {
        const mammoth = await loadMammoth();
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (!cancelled) setHtml(result.value);
      } catch(e) {
        if (!cancelled) setError(e.message || 'Could not convert document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dataUrl]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400"><Clock className="w-5 h-5 animate-spin mr-2"/>Converting…</div>;
  if (error) return <div className="flex items-center justify-center h-40 gap-2 text-red-400 text-sm p-4"><AlertCircle className="w-5 h-5"/>{error}</div>;
  return <div className="prose max-w-none p-6 overflow-y-auto" style={{fontFamily:'Georgia,serif',fontSize:`${fontSize}px`,lineHeight:1.8}} dangerouslySetInnerHTML={{__html:html}}/>;
};

/* ── Category Badge ──────────────────────────────────────────────────────── */
const CatBadge = ({ catId, size = 'sm' }) => {
  const cat = getCat(catId);
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad}`}
      style={{ background: cat.accent, color: cat.color }}>
      {cat.icon} {cat.label}
    </span>
  );
};

/* ── Prayer Items Display ────────────────────────────────────────────────── */
const PrayerItemsDisplay = ({ items, catId }) => {
  const templates = PRAYER_ITEMS[catId] || [];
  const filled = templates.filter(t => items?.[t.key]?.trim());
  if (!filled.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {filled.map(t => (
        <div key={t.key} className="flex gap-2 text-sm">
          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{t.label}: </span>
            <span className="text-gray-700">{items[t.key]}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Add Request Modal ───────────────────────────────────────────────────── */
const AddRequestModal = ({ onSave, onClose, editData = null }) => {
  const toast = useToast();
  const [person,    setPerson]    = useState(editData?.person    || '');
  const [text,      setText]      = useState(editData?.text      || '');
  const [category,  setCategory]  = useState(editData?.category  || 'personal');
  const [dateAdded, setDateAdded] = useState(editData?.dateAdded || today());
  const [items,     setItems]     = useState(editData?.items     || {});
  const [showItems, setShowItems] = useState(true);

  const templates = PRAYER_ITEMS[category] || [];
  const cat = getCat(category);

  const handleCatChange = (id) => {
    setCategory(id);
    setItems({});
  };

  const handleSave = () => {
    if (!text.trim() && !person.trim()) { toast('Please enter a person or prayer request.', 'error'); return; }
    onSave({
      id:          editData?.id || Date.now().toString(),
      text:        text.trim(),
      person:      person.trim(),
      category,
      dateAdded,
      items,
      answered:    editData?.answered    || false,
      dateAnswered:editData?.dateAnswered|| null,
      praise:      editData?.praise      || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0" style={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.accent}66)` }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              {editData ? 'Edit Prayer' : 'New Prayer Request'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 text-gray-400 transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>
          <p className="text-sm text-gray-500">Bring it before the Lord with faith</p>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Person */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Person / Topic
            </label>
            <input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="e.g. Juan dela Cruz, Our church plant, Puerto Princesa…"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-300"
              style={{ fontFamily: 'Georgia, serif' }}
              onFocus={e => e.target.style.borderColor = cat.color}
              onBlur={e => e.target.style.borderColor = '#f3f4f6'}
            />
          </div>

          {/* Main request */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Prayer Request
            </label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Write your prayer request… (or fill in specific items below)"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-300 resize-none"
              style={{ fontFamily: 'Georgia, serif' }}
              onFocus={e => e.target.style.borderColor = cat.color}
              onBlur={e => e.target.style.borderColor = '#f3f4f6'}
            />
          </div>

          {/* Category picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => handleCatChange(c.id)}
                  className="flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border-2 transition-all text-xs font-semibold"
                  style={{
                    borderColor: category === c.id ? c.color : '#f3f4f6',
                    background:  category === c.id ? c.bg    : '#fafafa',
                    color:       category === c.id ? c.color : '#9ca3af',
                    transform:   category === c.id ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <span className="text-xl">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Prayer Items */}
          {templates.length > 0 && (
            <div>
              <button onClick={() => setShowItems(v => !v)}
                className="flex items-center justify-between w-full mb-3 group">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer">
                  Specific Prayer Items <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                  {showItems ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </span>
              </button>

              {showItems && (
                <div className="space-y-3 rounded-2xl p-4 border-2" style={{ borderColor: cat.accent, background: cat.bg }}>
                  <p className="text-xs text-gray-400 -mt-1 mb-2">Fill in what you want to pray about for each area:</p>
                  {templates.map(t => (
                    <div key={t.key}>
                      <label className="block text-xs font-semibold mb-1" style={{ color: cat.color }}>{t.label}</label>
                      <textarea
                        value={items[t.key] || ''}
                        onChange={e => setItems(prev => ({ ...prev, [t.key]: e.target.value }))}
                        placeholder={`Specific request for ${t.label.toLowerCase()}…`}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border-2 border-white bg-white text-sm text-gray-700 outline-none transition-all placeholder:text-gray-200 resize-none"
                        onFocus={e => e.target.style.borderColor = cat.color}
                        onBlur={e => e.target.style.borderColor = 'white'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Date Started
            </label>
            <input type="date" value={dateAdded} onChange={e => setDateAdded(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-700 outline-none transition-all"
              onFocus={e => e.target.style.borderColor = cat.color}
              onBlur={e => e.target.style.borderColor = '#f3f4f6'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 shrink-0 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-2 h-12 px-8 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`, flex: 2 }}>
            {editData ? 'Save Changes' : '🙏 Save Prayer'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Mark Answered Modal ─────────────────────────────────────────────────── */
const MarkAnsweredModal = ({ request, onSave, onClose }) => {
  const [dateAnswered, setDateAnswered] = useState(today());
  const [praise, setPraise] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
          <h2 className="text-xl font-bold text-emerald-900" style={{ fontFamily: 'Georgia, serif' }}>🙌 Praise God!</h2>
          <p className="text-sm text-emerald-700 mt-0.5 line-clamp-2">
            {request.person ? `"${request.person}" — ` : ''}{request.text}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Date Answered</label>
            <input type="date" value={dateAnswered} onChange={e => setDateAnswered(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm outline-none focus:border-emerald-400 transition-all"/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              How did God answer? <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea value={praise} onChange={e => setPraise(e.target.value)}
              placeholder="Write your praise and testimony…"
              rows={4}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-700 outline-none focus:border-emerald-400 transition-all placeholder:text-gray-300 resize-none"
              style={{ fontFamily: 'Georgia, serif' }}/>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => { onSave({ dateAnswered, praise: praise.trim() }); onClose(); }}
            className="flex-2 h-12 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold hover:opacity-90 transition-all" style={{ flex: 2 }}>
            ✅ Mark Answered
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Request Card ────────────────────────────────────────────────────────── */
const RequestCard = ({ req, onMarkAnswered, onDelete, onUnmark, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = getCat(req.category);
  const hasItems = PRAYER_ITEMS[req.category]?.some(t => req.items?.[t.key]?.trim());

  return (
    <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
      req.answered ? 'bg-emerald-50/60 border-emerald-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
    }`}>
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ background: req.answered ? '#10b981' : cat.color }}/>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category icon pill */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
            style={{ background: cat.bg }}>
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            {req.person && (
              <p className="font-bold text-gray-800 text-sm mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{req.person}</p>
            )}
            {req.text && (
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>{req.text}</p>
            )}

            {/* Praise quote */}
            {req.answered && req.praise && (
              <div className="mt-2 pl-3 border-l-2 border-emerald-400">
                <p className="text-xs text-emerald-700 italic leading-relaxed">"{req.praise}"</p>
              </div>
            )}

            {/* Specific items (expandable) */}
            {hasItems && (
              <button onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: cat.color }}>
                {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                {expanded ? 'Hide' : 'Show'} prayer items
              </button>
            )}
            {expanded && hasItems && (
              <PrayerItemsDisplay items={req.items} catId={req.category}/>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CatBadge catId={req.category} size="xs"/>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3"/> {fmtDate(req.dateAdded)}
              </span>
              {req.answered && req.dateAnswered && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                  <CheckCheck className="w-3 h-3"/> Answered {fmtDate(req.dateAnswered)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {!req.answered ? (
              <button onClick={() => onMarkAnswered(req)} title="Mark answered"
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-emerald-500 hover:bg-emerald-50">
                <CheckCheck className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={() => onUnmark(req.id)} title="Move back to ongoing"
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-gray-300 hover:text-gray-500 hover:bg-gray-50">
                <RotateCcw className="w-3.5 h-3.5"/>
              </button>
            )}
            <button onClick={() => onEdit(req)} title="Edit"
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-gray-300 hover:text-blue-500 hover:bg-blue-50">
              <Pencil className="w-3.5 h-3.5"/>
            </button>
            <button onClick={() => onDelete(req.id)} title="Delete"
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-gray-200 hover:text-red-500 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main App ────────────────────────────────────────────────────────────── */
const PrayerJournalInner = () => {
  const toast = useToast();
  const [requests,   setRequests]   = useLocalStorage('prayerRequests_v2', []);
  const [savedFiles, setSavedFiles] = useLocalStorage('prayerFiles', []);

  const [activeTab,    setActiveTab]    = useState('requests');
  const [filterCat,    setFilterCat]    = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [markTarget,   setMarkTarget]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [showAnswered, setShowAnswered] = useState(true);

  const fileInputRef  = useRef();
  const [activeFile,   setActiveFile]   = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docFontSize,  setDocFontSize]  = useState(16);
  const fullscreenRef = useRef();

  /* ── Actions ── */
  const handleAddRequest = useCallback((req) => {
    setRequests(prev => {
      const exists = prev.find(r => r.id === req.id);
      return exists ? prev.map(r => r.id === req.id ? req : r) : [req, ...prev];
    });
    toast(editTarget ? 'Prayer updated ✏️' : 'Prayer request added 🙏');
    setEditTarget(null);
  }, [setRequests, editTarget, toast]);

  const handleMarkAnswered = useCallback(({ dateAnswered, praise }) => {
    if (!markTarget) return;
    setRequests(prev => prev.map(r =>
      r.id === markTarget.id ? { ...r, answered: true, dateAnswered, praise } : r
    ));
    toast('Praise God — answered! 🙌');
    setMarkTarget(null);
  }, [markTarget, setRequests, toast]);

  const handleUnmark = useCallback((id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, answered: false, dateAnswered: null, praise: '' } : r));
    toast('Moved back to ongoing', 'info');
  }, [setRequests, toast]);

  const handleDelete = useCallback((id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    toast('Removed', 'info');
  }, [setRequests, toast]);

  /* ── File actions ── */
  const readFile = useCallback((file, onReady) => {
    if (!file) return;
    const valid = file.type.includes('pdf') || file.type.includes('word') || isPdf(file.name) || isDocx(file.name);
    if (!valid)           { toast('Please select a PDF or Word file', 'error'); return; }
    if (file.size > MAX_FILE_BYTES) { toast('File too large (max 15 MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onReady(ev.target.result, isPdf(file.name) ? 'pdf' : 'docx');
    reader.readAsDataURL(file);
  }, [toast]);

  const handleSaveFile = useCallback((e) => {
    const file = e.target.files[0];
    readFile(file, (dataUrl, fileType) => {
      const f = { id: Date.now().toString(), name: file.name, size: file.size, fileType, dataUrl, savedAt: new Date().toISOString() };
      setSavedFiles(prev => [f, ...prev]);
      setActiveFile({ name: file.name, dataUrl, fileType });
      toast(`"${file.name}" saved!`);
    });
    e.target.value = '';
  }, [readFile, setSavedFiles, toast]);

  const handleDeleteFile = useCallback((id, e) => {
    e.stopPropagation();
    const file = savedFiles.find(f => f.id === id);
    setSavedFiles(prev => prev.filter(f => f.id !== id));
    if (activeFile?.dataUrl === file?.dataUrl) { setActiveFile(null); setIsFullscreen(false); }
    toast('File removed', 'info');
  }, [savedFiles, activeFile, setSavedFiles, toast]);

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

  /* ── Derived ── */
  const ongoing  = requests.filter(r => !r.answered);
  const answered = requests.filter(r =>  r.answered);

  const applyFilters = (list) => list
    .filter(r => filterCat === 'all' || r.category === filterCat)
    .filter(r => !search.trim() || [r.person, r.text, ...Object.values(r.items||{})].join(' ').toLowerCase().includes(search.toLowerCase()));

  const filteredOngoing  = applyFilters(ongoing);
  const filteredAnswered = applyFilters(answered);

  const TABS = [
    { id: 'requests', icon: '🙏', label: 'Prayers',  count: ongoing.length  },
    { id: 'praises',  icon: '⭐', label: 'Praises',  count: answered.length },
    { id: 'files',    icon: '📄', label: 'Files',    count: savedFiles.length },
  ];

  return (
    <>
      {(showAddModal || editTarget) && (
        <AddRequestModal
          onSave={handleAddRequest}
          onClose={() => { setShowAddModal(false); setEditTarget(null); }}
          editData={editTarget}
        />
      )}
      {markTarget && (
        <MarkAnsweredModal
          request={markTarget}
          onSave={handleMarkAnswered}
          onClose={() => setMarkTarget(null)}
        />
      )}

      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="max-w-lg mx-auto pb-24">

          {/* ── Header ── */}
          <div className="relative overflow-hidden px-5 pt-10 pb-8 mb-2"
            style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 40%, #be123c 100%)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
            <div className="relative z-10">
              <p className="text-purple-300 text-xs uppercase tracking-[0.2em] font-semibold mb-1">Thy will be done</p>
              <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>
                Prayer Journal
              </h1>
              <p className="text-purple-200 text-sm opacity-80">"Call to me and I will answer you." — Jer 33:3</p>

              {/* Stats row */}
              <div className="flex gap-3 mt-5">
                {[
                  { n: ongoing.length,  l: 'Ongoing',  c: '#fca5a5' },
                  { n: answered.length, l: 'Answered', c: '#86efac' },
                  { n: requests.length, l: 'Total',    c: '#c4b5fd' },
                ].map(s => (
                  <div key={s.l} className="flex-1 rounded-2xl py-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <p className="text-2xl font-black" style={{ color: s.c, fontFamily: 'Georgia, serif' }}>{s.n}</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-2">
            <div className="flex gap-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === t.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === t.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-4 space-y-4">

            {/* ── REQUESTS TAB ── */}
            {activeTab === 'requests' && (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search prayers, people…"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-700 outline-none focus:border-indigo-200 transition-all placeholder:text-gray-300"/>
                </div>

                {/* Category filters */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border-2"
                      style={{
                        background:   filterCat === cat.id ? cat.bg    : 'white',
                        borderColor:  filterCat === cat.id ? cat.color : '#f3f4f6',
                        color:        filterCat === cat.id ? cat.color : '#9ca3af',
                      }}>
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>

                {/* Ongoing prayers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse inline-block"/>
                      Ongoing Prayers
                      <span className="text-xs text-gray-400 font-normal">({filteredOngoing.length})</span>
                    </h3>
                    <button onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #4c1d95, #be123c)' }}>
                      <Plus className="w-3 h-3"/> Add
                    </button>
                  </div>

                  {filteredOngoing.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOngoing.map(req => (
                        <RequestCard key={req.id} req={req}
                          onMarkAnswered={setMarkTarget}
                          onDelete={handleDelete}
                          onUnmark={handleUnmark}
                          onEdit={setEditTarget}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                      <p className="text-4xl mb-3">🙏</p>
                      <p className="text-sm font-semibold text-gray-400">No prayer requests yet</p>
                      <p className="text-xs text-gray-300 mt-1">Tap "Add" to begin</p>
                    </div>
                  )}
                </div>

                {/* Answered section */}
                {filteredAnswered.length > 0 && (
                  <div>
                    <button onClick={() => setShowAnswered(v => !v)}
                      className="w-full flex items-center justify-between py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>
                        <h3 className="font-bold text-gray-600 text-sm">
                          Answered Prayers
                          <span className="ml-1.5 text-xs text-gray-400 font-normal">({filteredAnswered.length})</span>
                        </h3>
                      </div>
                      {showAnswered ? <ChevronUp className="w-4 h-4 text-gray-300"/> : <ChevronDown className="w-4 h-4 text-gray-300"/>}
                    </button>
                    {showAnswered && (
                      <div className="space-y-3">
                        {filteredAnswered.map(req => (
                          <RequestCard key={req.id} req={req}
                            onMarkAnswered={setMarkTarget}
                            onDelete={handleDelete}
                            onUnmark={handleUnmark}
                            onEdit={setEditTarget}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── PRAISES TAB ── */}
            {activeTab === 'praises' && (
              <div className="space-y-4">
                {answered.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-5xl mb-3">⭐</p>
                    <p className="text-sm font-semibold text-gray-400">No answered prayers yet</p>
                    <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto">
                      When you mark a prayer as answered it will appear here as testimony.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
                      <p className="font-bold text-emerald-800" style={{ fontFamily: 'Georgia, serif' }}>
                        🙌 {answered.length} Answered {answered.length === 1 ? 'Prayer' : 'Prayers'}
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5 italic">"He who calls you is faithful; he will surely do it." — 1 Thess 5:24</p>
                    </div>
                    {answered.map(req => {
                      const cat = getCat(req.category);
                      return (
                        <div key={req.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4">
                          <div className="h-1 rounded-full mb-3 w-12" style={{ background: cat.color }}/>
                          {req.person && <p className="font-bold text-gray-800 mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{req.person}</p>}
                          {req.text   && <p className="text-sm text-gray-600 leading-relaxed">{req.text}</p>}
                          {req.praise && (
                            <div className="mt-3 p-3 rounded-xl" style={{ background: '#ecfdf5' }}>
                              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">🙌 Testimony</p>
                              <p className="text-sm text-emerald-800 italic" style={{ fontFamily: 'Georgia, serif' }}>"{req.praise}"</p>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <CatBadge catId={req.category} size="xs"/>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCheck className="w-3 h-3"/> Answered {fmtDate(req.dateAnswered)}
                            </span>
                            <button onClick={() => handleDelete(req.id)}
                              className="ml-auto w-7 h-7 flex items-center justify-center rounded-xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── FILES TAB ── */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed font-semibold text-sm transition-all"
                  style={{ borderColor: '#c7d2fe', color: '#6366f1', background: '#eef2ff' }}>
                  <FolderOpen className="w-5 h-5"/> Open a File (PDF or Word)
                </button>
                <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleSaveFile}/>
                <p className="text-xs text-gray-400 text-center -mt-2">Supports PDF and Word (.doc, .docx) · Max 15 MB</p>

                {activeFile && (
                  <div ref={fullscreenRef} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden"
                    style={isFullscreen ? { position:'fixed',inset:0,zIndex:9999,borderRadius:0,border:'none' } : {}}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700 truncate max-w-[60%]">{activeFile.name}</p>
                      <div className="flex items-center gap-1">
                        {activeFile.fileType === 'docx' && (
                          <div className="flex items-center gap-0.5 mr-2 bg-gray-100 rounded-xl p-0.5">
                            <button onClick={() => setDocFontSize(s => Math.max(12, s-2))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 font-bold text-sm">A−</button>
                            <span className="text-xs text-gray-400 font-mono w-6 text-center">{docFontSize}</span>
                            <button onClick={() => setDocFontSize(s => Math.min(32, s+2))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 font-bold text-sm">A+</button>
                          </div>
                        )}
                        <button onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-400">
                          {isFullscreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => { setActiveFile(null); setIsFullscreen(false); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                    {activeFile.fileType === 'pdf' ? (
                      <iframe src={activeFile.dataUrl} title={activeFile.name} className="w-full" style={{ height: isFullscreen ? 'calc(100vh - 52px)' : '70vh', border: 'none', display: 'block' }}/>
                    ) : (
                      <div style={{ height: isFullscreen ? 'calc(100vh - 52px)' : '70vh', overflowY: 'auto' }}>
                        <DocxViewer dataUrl={activeFile.dataUrl} fontSize={docFontSize}/>
                      </div>
                    )}
                  </div>
                )}

                {savedFiles.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4">
                    <h3 className="font-bold text-gray-700 text-sm mb-3">Saved Files ({savedFiles.length})</h3>
                    <div className="space-y-2">
                      {savedFiles.map(file => {
                        const isActive = activeFile?.dataUrl === file.dataUrl;
                        return (
                          <div key={file.id}
                            onClick={() => setActiveFile({ name: file.name, dataUrl: file.dataUrl, fileType: file.fileType })}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2"
                            style={{
                              borderColor: isActive ? '#818cf8' : '#f3f4f6',
                              background:  isActive ? '#eef2ff' : '#fafafa',
                            }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                              style={{ background: isActive ? '#e0e7ff' : '#f3f4f6' }}>
                              {isPdf(file.name) ? '📄' : '📝'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-700 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{fmtSize(file.size)} · {new Date(file.savedAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={(e) => handleDeleteFile(file.id, e)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {savedFiles.length === 0 && !activeFile && (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-5xl mb-3">📂</p>
                    <p className="text-sm font-semibold text-gray-400">No files saved yet</p>
                    <p className="text-xs text-gray-300 mt-1">Open a PDF or Word doc to access anytime</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* FAB */}
        {activeTab === 'requests' && (
          <button onClick={() => setShowAddModal(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #be123c)' }}>
            <Plus className="w-6 h-6"/>
          </button>
        )}
      </div>
    </>
  );
};

export default function PrayerJournal() {
  return (
    <ToastProvider>
      <PrayerJournalInner/>
    </ToastProvider>
  );
}