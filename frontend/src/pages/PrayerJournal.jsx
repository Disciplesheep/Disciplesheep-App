import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useScreenSize } from '@/hooks/useScreenSize';
import {
  Plus, Trash2, CheckCheck, RotateCcw, Calendar,
  Flame, Star, Search, ChevronDown, ChevronUp,
  Heart, Home, Users, BookOpen, Globe, Filter, Pencil,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

/* ── Constants & helpers ─────────────────────────────────────────────────── */
const todayIso = () => new Date().toISOString().split('T')[0];
const fmtDate  = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const preventSelectClose = (e) => {
  if (e.target.closest('[data-radix-popper-content-wrapper]')) e.preventDefault();
};
const IC = 'text-xs border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100';

/* ── Category & prayer-item data ─────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',       label: 'All',       Icon: Filter,   badge: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'        },
  { id: 'personal',  label: 'Personal',  Icon: Heart,    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'          },
  { id: 'family',    label: 'Family',    Icon: Home,     badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'      },
  { id: 'timothy',   label: 'Timothys',  Icon: Users,    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'          },
  { id: 'church',    label: 'Church',    Icon: BookOpen, badge: 'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400'  },
  { id: 'community', label: 'Community', Icon: Globe,    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'  },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const getCat  = (id) => CAT_MAP[id] || CATEGORIES[1];

const PRAYER_ITEMS = {
  personal:  [
    { key: 'salvation', label: 'Salvation / Faith Journey' },
    { key: 'health',    label: 'Physical / Mental Health'  },
    { key: 'spiritual', label: 'Spiritual Growth'          },
    { key: 'provision', label: 'Daily Provision & Needs'   },
    { key: 'guidance',  label: 'Guidance & Decisions'      },
    { key: 'struggles', label: 'Personal Struggles'        },
    { key: 'gratitude', label: 'Gratitude Items'           },
  ],
  family: [
    { key: 'unity',     label: 'Family Unity & Harmony'   },
    { key: 'salvation', label: 'Salvation of Family'      },
    { key: 'health',    label: 'Health & Protection'      },
    { key: 'children',  label: 'Children / Youth'         },
    { key: 'marriage',  label: 'Marriage / Relationships' },
    { key: 'provision', label: 'Financial Provision'      },
  ],
  timothy: [
    { key: 'discipleship', label: 'Discipleship Growth'    },
    { key: 'calling',      label: 'Calling & Purpose'      },
    { key: 'character',    label: 'Character Development'  },
    { key: 'community',    label: 'Gospel Community'       },
    { key: 'struggles',    label: 'Struggles & Temptations'},
    { key: 'ministry',     label: 'Ministry Opportunities' },
  ],
  church: [
    { key: 'leadership', label: 'Church Leadership'      },
    { key: 'unity',      label: 'Unity & Love'           },
    { key: 'outreach',   label: 'Evangelism & Outreach'  },
    { key: 'growth',     label: 'Spiritual Growth'       },
    { key: 'missions',   label: 'Missions & Church Plants'},
    { key: 'provision',  label: 'Resources & Provision'  },
  ],
  community: [
    { key: 'leaders',      label: "Local Leaders / Gov't"    },
    { key: 'lost',         label: 'The Lost / Unsaved'       },
    { key: 'poor',         label: 'The Poor & Marginalized'  },
    { key: 'peace',        label: 'Peace & Justice'          },
    { key: 'revival',      label: 'Revival & Awakening'      },
    { key: 'missionaries', label: 'Missionaries in the Field'},
  ],
};

/* ── Back-button close hook ──────────────────────────────────────────────── */
function useBackButtonClose(isOpen, closeFn) {
  useEffect(() => {
    if (!isOpen) return;
    window.__dialogOpenCount = (window.__dialogOpenCount || 0) + 1;
    window.history.pushState({ dialog: true }, '');
    const onPop = () => { document.activeElement?.blur(); setTimeout(closeFn, 50); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.__dialogOpenCount = Math.max(0, (window.__dialogOpenCount || 1) - 1);
    };
  }, [isOpen, closeFn]);
}

/* ── Shared: small Textarea ──────────────────────────────────────────────── */
const Tx = ({ value, onChange, placeholder, rows = 2, className = '' }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className={`w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors placeholder:text-stone-400 resize-none ${className}`} />
);

/* ── Prayer Items Display ────────────────────────────────────────────────── */
const PrayerItemsDisplay = memo(({ items, catId }) => {
  const filled = (PRAYER_ITEMS[catId] || []).filter(t => items?.[t.key]?.trim());
  if (!filled.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {filled.map(t => (
        <div key={t.key} className="flex gap-2 text-xs">
          <span className="text-stone-300 shrink-0 mt-0.5">•</span>
          <span>
            <span className="font-bold uppercase tracking-wide text-stone-400">{t.label}: </span>
            <span className="text-stone-600 dark:text-stone-400">{items[t.key]}</span>
          </span>
        </div>
      ))}
    </div>
  );
});
PrayerItemsDisplay.displayName = 'PrayerItemsDisplay';

/* ── Add / Edit Dialog ───────────────────────────────────────────────────── */
const RequestDialog = memo(({ open, onClose, onSave, editData }) => {
  const [person,    setPerson]    = useState('');
  const [text,      setText]      = useState('');
  const [category,  setCategory]  = useState('personal');
  const [dateAdded, setDateAdded] = useState(todayIso);
  const [items,     setItems]     = useState({});
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPerson(editData?.person    || '');
    setText(editData?.text        || '');
    setCategory(editData?.category || 'personal');
    setDateAdded(editData?.dateAdded || todayIso());
    setItems(editData?.items       || {});
    setShowItems(false);
  }, [open, editData]);

  useBackButtonClose(open, onClose);

  const templates = PRAYER_ITEMS[category] || [];

  const handleSave = () => {
    if (!text.trim() && !person.trim()) { toast.error('Please enter a person or prayer request.'); return; }
    onSave({
      id:          editData?.id            || Date.now().toString(),
      text:        text.trim(),
      person:      person.trim(),
      category,
      dateAdded,
      items,
      answered:    editData?.answered      || false,
      dateAnswered:editData?.dateAnswered  || null,
      praise:      editData?.praise        || '',
    });
    onClose();
  };

  const setItem = useCallback((key) => (e) =>
    setItems(prev => ({ ...prev, [key]: e.target.value })), []);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onPointerDownOutside={preventSelectClose}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{editData ? 'Edit Prayer' : 'New Prayer Request'}</DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-stone-400">Bring it before the Lord with faith</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Person / Topic <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="e.g. Juan dela Cruz, our church plant…" className={IC} />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Prayer Request</Label>
            <Tx value={text} onChange={e => setText(e.target.value)}
              placeholder="Write your prayer request… (or fill specific items below)" rows={3} />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => { setCategory(c.id); setItems({}); }}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    category === c.id
                      ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400'
                      : 'border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}>
                  <c.Icon className="w-3.5 h-3.5 shrink-0" /> {c.label}
                </button>
              ))}
            </div>
          </div>

          {templates.length > 0 && (
            <div>
              <button onClick={() => setShowItems(v => !v)}
                className="flex items-center justify-between w-full mb-2">
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold cursor-pointer">
                  Specific Items <span className="normal-case font-normal">(optional)</span>
                </Label>
                {showItems ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </button>
              {showItems && (
                <div className="space-y-3 rounded-xl p-4 border border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/30">
                  <p className="text-xs text-stone-400 dark:text-stone-500 -mt-1 mb-1">Fill in specific requests per area:</p>
                  {templates.map(t => (
                    <div key={t.key}>
                      <Label className="text-xs font-semibold text-forest-700 dark:text-forest-400 mb-1 block">{t.label}</Label>
                      <Tx value={items[t.key] || ''} onChange={setItem(t.key)}
                        placeholder={`Specific request for ${t.label.toLowerCase()}…`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Started</Label>
            <Input type="date" value={dateAdded} onChange={e => setDateAdded(e.target.value)} className={IC} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose}
              className="flex-1 rounded-xl border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-forest-500 hover:bg-forest-700 text-white rounded-xl">
              {editData ? 'Save Changes' : '🙏 Save Prayer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
RequestDialog.displayName = 'RequestDialog';

/* ── Mark Answered Dialog ────────────────────────────────────────────────── */
const MarkAnsweredDialog = memo(({ open, request, onClose, onSave }) => {
  const [dateAnswered, setDateAnswered] = useState(todayIso);
  const [praise,       setPraise]       = useState('');

  useEffect(() => { if (open) { setDateAnswered(todayIso()); setPraise(''); } }, [open]);
  useBackButtonClose(open, onClose);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">🙌 Praise God!</DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-stone-400 line-clamp-2">
            {request?.person ? `"${request.person}" — ` : ''}{request?.text}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Answered</Label>
            <Input type="date" value={dateAnswered} onChange={e => setDateAnswered(e.target.value)} className={IC} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              How did God answer? <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Tx value={praise} onChange={e => setPraise(e.target.value)}
              placeholder="Write your praise and testimony…" rows={4}
              className="font-serif" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}
              className="flex-1 rounded-xl border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400">
              Cancel
            </Button>
            <Button onClick={() => { onSave({ dateAnswered, praise: praise.trim() }); onClose(); }}
              className="flex-1 bg-forest-500 hover:bg-forest-700 text-white rounded-xl">
              ✅ Mark Answered
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
MarkAnsweredDialog.displayName = 'MarkAnsweredDialog';

/* ── Request Card ────────────────────────────────────────────────────────── */
const RequestCard = memo(({ req, onMarkAnswered, onDelete, onUnmark, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const cat      = getCat(req.category);
  const catLabel = cat.label;
  const hasItems = useMemo(
    () => (PRAYER_ITEMS[req.category] || []).some(t => req.items?.[t.key]?.trim()),
    [req.category, req.items]
  );

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      req.answered
        ? 'bg-forest-50/50 dark:bg-forest-900/10 border-forest-200 dark:border-forest-800'
        : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${req.answered ? 'bg-forest-500' : 'bg-rose-400 animate-pulse'}`} />

          <div className="flex-1 min-w-0">
            {req.person && <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">{req.person}</p>}
            {req.text   && <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">{req.text}</p>}

            {req.answered && req.praise && (
              <div className="mt-2 pl-3 border-l-2 border-forest-400">
                <p className="text-xs text-forest-700 dark:text-forest-400 italic leading-relaxed">"{req.praise}"</p>
              </div>
            )}

            {hasItems && (
              <button onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-forest-600 dark:text-forest-400 hover:opacity-80 transition-opacity">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide' : 'Show'} prayer items
              </button>
            )}
            {expanded && <PrayerItemsDisplay items={req.items} catId={req.category} />}

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{catLabel}</span>
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
              <button onClick={() => onMarkAnswered(req)} title="Mark answered"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 text-forest-600 dark:text-forest-400 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => onUnmark(req.id)} title="Move back to ongoing"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-400 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => onEdit(req)} title="Edit"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-stone-300 dark:text-stone-600 hover:text-blue-500 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(req.id)} title="Delete"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
RequestCard.displayName = 'RequestCard';

/* ── Praise Card (answered-only read view) ───────────────────────────────── */
const PraiseCard = memo(({ req, onDelete }) => {
  const cat = getCat(req.category);
  return (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <Star className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
        </div>
        <div className="flex-1 min-w-0">
          {req.person && <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-0.5">{req.person}</p>}
          <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">{req.text}</p>
          {req.praise && (
            <div className="mt-2.5 p-3 rounded-lg bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800">
              <p className="text-[10px] font-bold text-forest-700 dark:text-forest-400 uppercase tracking-widest mb-1">🙌 Praise</p>
              <p className="text-sm text-forest-800 dark:text-forest-300 italic leading-relaxed">"{req.praise}"</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Started {fmtDate(req.dateAdded)}
            </span>
            {req.dateAnswered && (
              <span className="text-[10px] text-forest-600 dark:text-forest-400 flex items-center gap-1 font-medium">
                <CheckCheck className="w-3 h-3" /> Answered {fmtDate(req.dateAnswered)}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(req.id)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
});
PraiseCard.displayName = 'PraiseCard';

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const PrayerJournal = () => {
  const { isTablet } = useScreenSize();
  const [requests, setRequests] = useLocalStorage('prayerRequests_v2', []);

  const [view,         setView]         = useState('ongoing'); // 'ongoing' | 'praises'
  const [filterCat,    setFilterCat]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [showAnswered, setShowAnswered] = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [markTarget,   setMarkTarget]   = useState(null);

  /* ── Stable actions ── */
  const handleSave = useCallback((req) => {
    setRequests(prev => {
      const i = prev.findIndex(r => r.id === req.id);
      return i >= 0 ? prev.map(r => r.id === req.id ? req : r) : [req, ...prev];
    });
    toast.success(editTarget ? 'Prayer updated ✏️' : 'Prayer request added 🙏');
    setEditTarget(null);
  }, [setRequests, editTarget]);

  const handleMarkAnswered = useCallback(({ dateAnswered, praise }) => {
    if (!markTarget) return;
    setRequests(prev => prev.map(r =>
      r.id === markTarget.id ? { ...r, answered: true, dateAnswered, praise } : r
    ));
    toast.success('Praise God — answered! 🙌');
    setMarkTarget(null);
  }, [markTarget, setRequests]);

  const handleUnmark = useCallback((id) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, answered: false, dateAnswered: null, praise: '' } : r
    ));
    toast('Moved back to ongoing');
  }, [setRequests]);

  const handleDelete = useCallback((id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success('Removed');
  }, [setRequests]);

  const openEdit   = useCallback((req) => setEditTarget(req), []);
  const openMark   = useCallback((req) => setMarkTarget(req), []);
  const closeModal = useCallback(() => { setAddOpen(false); setEditTarget(null); }, []);

  /* ── Memoised derived lists ── */
  const [ongoing, answered] = useMemo(() => [
    requests.filter(r => !r.answered),
    requests.filter(r =>  r.answered),
  ], [requests]);

  const filter = useCallback((list) => {
    const q = search.trim().toLowerCase();
    return list
      .filter(r => filterCat === 'all' || r.category === filterCat)
      .filter(r => !q || [r.person, r.text, ...Object.values(r.items || {})].join(' ').toLowerCase().includes(q));
  }, [filterCat, search]);

  const filteredOngoing  = useMemo(() => filter(ongoing),  [filter, ongoing]);
  const filteredAnswered = useMemo(() => filter(answered), [filter, answered]);

  /* ── Sub-views ── */
  const categoryFilterBar = (
    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => setFilterCat(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
            filterCat === cat.id
              ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
          }`}>
          <cat.Icon className="w-3 h-3" /> {cat.label}
        </button>
      ))}
    </div>
  );

  const ongoingView = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-stone-600" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search prayers, people…"
          className="pl-9 text-xs border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100" />
      </div>

      {categoryFilterBar}

      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm">Ongoing Prayers</h3>
            <span className="text-xs text-stone-400 dark:text-stone-500">({filteredOngoing.length})</span>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}
            className="h-7 px-3 rounded-lg bg-forest-500 hover:bg-forest-700 text-white text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="p-3 space-y-2">
          {filteredOngoing.length > 0 ? filteredOngoing.map(req => (
            <RequestCard key={req.id} req={req}
              onMarkAnswered={openMark} onDelete={handleDelete}
              onUnmark={handleUnmark}  onEdit={openEdit} />
          )) : (
            <div className="text-center py-10 text-stone-400 dark:text-stone-500">
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No ongoing prayer requests</p>
              <button onClick={() => setAddOpen(true)} className="mt-1 text-xs text-rose-500 hover:text-rose-600 font-medium">
                + Add one
              </button>
            </div>
          )}
        </div>
      </Card>

      {filteredAnswered.length > 0 && (
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
          <button onClick={() => setShowAnswered(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-400" />
              <h3 className="font-serif font-semibold text-stone-700 dark:text-stone-300 text-sm">
                Answered Prayers <span className="text-xs text-stone-400 dark:text-stone-500 font-normal">({filteredAnswered.length})</span>
              </h3>
            </div>
            {showAnswered ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          {showAnswered && (
            <div className="p-3 space-y-2">
              {filteredAnswered.map(req => (
                <RequestCard key={req.id} req={req}
                  onMarkAnswered={openMark} onDelete={handleDelete}
                  onUnmark={handleUnmark}  onEdit={openEdit} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );

  const praisesView = (
    <div className="space-y-3">
      {answered.length === 0 ? (
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
          <div className="text-center py-14 text-stone-400 dark:text-stone-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No answered prayers yet</p>
            <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              When you mark a prayer as answered it will appear here as testimony.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800">
            <CheckCheck className="w-5 h-5 text-forest-600 dark:text-forest-400 shrink-0" />
            <p className="text-xs text-forest-800 dark:text-forest-300 italic leading-relaxed">
              "He who calls you is faithful; he will surely do it." — 1 Thess 5:24
            </p>
          </div>
          {answered.map(req => <PraiseCard key={req.id} req={req} onDelete={handleDelete} />)}
        </>
      )}
    </div>
  );

  const viewToggle = (
    <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
      {[
        { id: 'ongoing',  label: 'Ongoing',  Icon: Flame, count: ongoing.length,  active: 'text-rose-600 dark:text-rose-400'   },
        { id: 'praises',  label: 'Praises',  Icon: Star,  count: answered.length, active: 'text-forest-600 dark:text-forest-400'},
      ].map(t => (
        <button key={t.id} onClick={() => setView(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            view === t.id
              ? `bg-white dark:bg-stone-700 ${t.active} shadow-sm`
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}>
          <t.Icon className="w-3.5 h-3.5" /> {t.label} ({t.count})
        </button>
      ))}
    </div>
  );

  const header = (
    <div className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: 'linear-gradient(160deg, #1c1917 0%, #4c1d95 40%, #be123c 100%)', padding: isTablet ? '2rem' : '1.5rem' }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10">
        <p className="text-purple-300 text-xs uppercase tracking-[0.2em] font-semibold mb-1">Thy will be done</p>
        <h1 className={`font-serif font-bold tracking-tight mb-1 ${isTablet ? 'text-4xl' : 'text-3xl'}`}>Prayer Journal</h1>
        <p className="text-purple-200 text-sm opacity-80">"Call to me and I will answer you." — Jer 33:3</p>
        <div className="flex gap-3 mt-5">
          {[
            { n: ongoing.length,  l: 'Ongoing',  c: '#fca5a5' },
            { n: answered.length, l: 'Answered', c: '#86efac' },
            { n: requests.length, l: 'Total',    c: '#c4b5fd' },
          ].map(s => (
            <div key={s.l} className="flex-1 rounded-xl py-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <p className="text-2xl font-black font-serif" style={{ color: s.c }}>{s.n}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <RequestDialog open={addOpen || !!editTarget} onClose={closeModal} onSave={handleSave} editData={editTarget} />
      <MarkAnsweredDialog open={!!markTarget} request={markTarget} onClose={() => setMarkTarget(null)} onSave={handleMarkAnswered} />

      {isTablet ? (
        <div className="space-y-6">
          {header}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              {viewToggle}
              {view === 'ongoing' ? ongoingView : praisesView}
            </div>
            <div className="space-y-4">
              <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5">
                <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 mb-3">Prayer Stats</p>
                <div className="space-y-3">
                  {[
                    { label: 'Total Requests', value: requests.length },
                    { label: 'Still Believing', value: ongoing.length  },
                    { label: 'Answered',        value: answered.length },
                    { label: 'Answer Rate',     value: requests.length ? `${Math.round((answered.length / requests.length) * 100)}%` : '—' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{s.label}</span>
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100">{s.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="bg-forest-50 dark:bg-forest-900/20 rounded-xl border border-forest-100 dark:border-forest-800 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-forest-700 dark:text-forest-400 mb-2">Today's Encouragement</p>
                <p className="text-sm text-forest-800 dark:text-forest-300 italic font-serif leading-relaxed">
                  "Do not be anxious about anything, but in every situation, by prayer and petition,
                  with thanksgiving, present your requests to God."
                </p>
                <p className="text-xs text-forest-600 dark:text-forest-500 mt-2 font-semibold">— Philippians 4:6</p>
              </Card>
              <Button onClick={() => setAddOpen(true)}
                className="w-full h-12 bg-forest-500 hover:bg-forest-700 text-white rounded-xl font-serif text-base">
                <Plus className="w-4 h-4 mr-2" /> New Prayer Request
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {header}
          {viewToggle}
          {view === 'ongoing' ? ongoingView : praisesView}
        </div>
      )}

      {!isTablet && (
        <button onClick={() => setAddOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #be123c)' }}>
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default PrayerJournal;