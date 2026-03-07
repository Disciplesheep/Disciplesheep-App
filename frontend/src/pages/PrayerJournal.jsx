import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useScreenSize } from '@/hooks/useScreenSize';
import {
  Plus, Trash2, CheckCheck, RotateCcw, Calendar,
  Flame, Star, Search, ChevronDown, ChevronUp,
  Heart, Home, Users, BookOpen, Globe, Filter, Pencil,
  HandHeart, CheckSquare, Square, MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const todayIso = () => new Date().toISOString().split('T')[0];
const fmtDate  = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const preventSelectClose = (e) => {
  if (e.target.closest('[data-radix-popper-content-wrapper]')) e.preventDefault();
};
const IC = 'text-xs border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100';

/* ── Categories ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',       label: 'All',       Icon: Filter,    badge: 'bg-stone-100  dark:bg-stone-800    text-stone-600  dark:text-stone-400'          },
  { id: 'personal',  label: 'Personal',  Icon: Heart,     badge: 'bg-rose-100   dark:bg-rose-900/30  text-rose-700   dark:text-rose-400'            },
  { id: 'family',    label: 'Family',    Icon: Home,      badge: 'bg-amber-100  dark:bg-amber-900/30 text-amber-700  dark:text-amber-400'           },
  { id: 'timothy',   label: 'Timothys',  Icon: Users,     badge: 'bg-blue-100   dark:bg-blue-900/30  text-blue-700   dark:text-blue-400'            },
  { id: 'church',    label: 'Church',    Icon: BookOpen,  badge: 'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400'        },
  { id: 'community', label: 'Community', Icon: Globe,     badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'        },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const getCat  = (id) => CAT_MAP[id] || CATEGORIES[1];

/* ── Prefilled Prayer Checklists per category ────────────────────────────── */
const PRAYER_CHECKLISTS = {
  personal: [
    { key: 'salvation',   label: 'Faith & salvation',         prompt: 'Lord, grow my trust and deepen my walk with You…'           },
    { key: 'holiness',    label: 'Holiness & surrender',      prompt: 'Help me surrender the areas where I\'m still holding on…'   },
    { key: 'health',      label: 'Physical & mental health',  prompt: 'Strengthen my body and guard my mind today…'                },
    { key: 'spiritual',   label: 'Spiritual disciplines',     prompt: 'Give me hunger for Your Word, prayer, and fasting…'         },
    { key: 'provision',   label: 'Daily provision & needs',   prompt: 'Provide for my needs according to Your riches in glory…'    },
    { key: 'guidance',    label: 'Guidance & decisions',      prompt: 'Direct my steps and make my path clear before me…'          },
    { key: 'struggles',   label: 'Temptations & struggles',   prompt: 'Where I am weak, be my strength and deliver me…'            },
    { key: 'gratitude',   label: 'Thanksgiving',              prompt: 'Thank you Lord for…'                                         },
  ],
  family: [
    { key: 'salvation',   label: 'Salvation of family',       prompt: 'Open their hearts to the gospel, Lord…'                     },
    { key: 'unity',       label: 'Family unity & harmony',    prompt: 'Bind our home with love and peace that passes understanding…' },
    { key: 'marriage',    label: 'Marriage & relationship',   prompt: 'Strengthen the covenant and deepen our love…'               },
    { key: 'children',    label: 'Children & youth',          prompt: 'Protect them, shape their character, keep them close to You…' },
    { key: 'health',      label: 'Health & protection',       prompt: 'Guard each member from sickness, harm, and evil…'           },
    { key: 'provision',   label: 'Financial provision',       prompt: 'Meet every need and teach us faithful stewardship…'         },
    { key: 'witness',     label: 'Family as a witness',       prompt: 'Let our home be a light that draws others to Christ…'       },
  ],
  timothy: [
    { key: 'calling',        label: 'Calling & purpose',        prompt: 'Affirm their calling and set their feet on mission…'       },
    { key: 'discipleship',   label: 'Discipleship growth',      prompt: 'Deepen their rootedness in Scripture and prayer…'          },
    { key: 'character',      label: 'Character & integrity',    prompt: 'Make them people of uncompromising character…'             },
    { key: 'community',      label: 'Gospel community',         prompt: 'Surround them with faithful brothers and sisters…'         },
    { key: 'boldness',       label: 'Boldness in witness',      prompt: 'Give them courage to share Christ in their sphere…'        },
    { key: 'struggles',      label: 'Struggles & temptations',  prompt: 'Protect them from the evil one and strengthen them…'       },
    { key: 'ministry',       label: 'Ministry opportunities',   prompt: 'Open doors for them to serve and lead others…'             },
    { key: 'multiplication', label: 'Multiplying disciples',    prompt: 'Make them faithful to pass on what they\'ve received…'    },
  ],
  church: [
    { key: 'leadership',  label: 'Church leadership',          prompt: 'Give wisdom, humility, and a shepherd\'s heart…'           },
    { key: 'unity',       label: 'Unity & love',               prompt: 'May we be one as You and the Father are one…'              },
    { key: 'preaching',   label: 'Preaching & teaching',       prompt: 'Let the Word go forth with power and clarity…'             },
    { key: 'outreach',    label: 'Evangelism & outreach',      prompt: 'Stir a passion to seek the lost at every cost…'            },
    { key: 'growth',      label: 'Spiritual growth',           prompt: 'Move the whole congregation into deeper maturity…'         },
    { key: 'missions',    label: 'Missions & church plants',   prompt: 'Raise up senders, goers, and faithful partners…'           },
    { key: 'provision',   label: 'Resources & provision',      prompt: 'Supply every need for the work You\'ve called us to…'     },
    { key: 'revival',     label: 'Revival & renewal',          prompt: 'Pour out Your Spirit afresh upon this congregation…'       },
  ],
  community: [
    { key: 'lost',         label: 'The lost & unsaved',        prompt: 'Soften hearts and send laborers into this harvest field…'  },
    { key: 'leaders',      label: 'Local leaders & gov\'t',    prompt: 'Grant wisdom, justice, and a fear of God to authorities…' },
    { key: 'poor',         label: 'The poor & marginalized',   prompt: 'Let justice roll and Your compassion flow through us…'     },
    { key: 'sick',         label: 'The sick & suffering',      prompt: 'Bring healing and hope to those in pain…'                  },
    { key: 'peace',        label: 'Peace & justice',           prompt: 'Break every chain of violence, hatred, and injustice…'     },
    { key: 'revival',      label: 'Community revival',         prompt: 'Transform our barangay/city by the power of the gospel…'  },
    { key: 'missionaries', label: 'Missionaries in the field', prompt: 'Protect, sustain, and multiply every sent one…'            },
    { key: 'unreached',    label: 'Unreached peoples',         prompt: 'Let every tribe and tongue hear the name of Jesus…'        },
  ],
};

const buildChecklist = (catId) =>
  (PRAYER_CHECKLISTS[catId] || []).map(t => ({ ...t, checked: false, note: '' }));

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

/* ── Small Textarea ──────────────────────────────────────────────────────── */
const Tx = ({ value, onChange, placeholder, rows = 2, className = '' }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className={`w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/60 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-forest-400 transition-colors placeholder:text-stone-400 resize-none ${className}`} />
);

/* ── Checklist Display (card view) ──────────────────────────────────────── */
const ChecklistDisplay = memo(({ checklist }) => {
  const checked = (checklist || []).filter(i => i.checked);
  if (!checked.length) return null;
  return (
    <div className="mt-2.5 space-y-1">
      {checked.map(item => (
        <div key={item.key} className="flex gap-2 text-xs items-start">
          <CheckCheck className="w-3 h-3 text-forest-500 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-stone-500 dark:text-stone-400">{item.label}</span>
            {item.note && <span className="text-stone-400 dark:text-stone-500"> — {item.note}</span>}
          </span>
        </div>
      ))}
    </div>
  );
});
ChecklistDisplay.displayName = 'ChecklistDisplay';

/* ── Add / Edit Dialog ───────────────────────────────────────────────────── */
const RequestDialog = memo(({ open, onClose, onSave, editData }) => {
  const [person,    setPerson]    = useState('');
  const [text,      setText]      = useState('');
  const [category,  setCategory]  = useState('personal');
  const [dateAdded, setDateAdded] = useState(todayIso);
  const [checklist, setChecklist] = useState(() => buildChecklist('personal'));
  const [showList,  setShowList]  = useState(true);

  useEffect(() => {
    if (!open) return;
    const cat = editData?.category || 'personal';
    setPerson(editData?.person    || '');
    setText(editData?.text        || '');
    setCategory(cat);
    setDateAdded(editData?.dateAdded || todayIso());
    setChecklist(editData?.checklist?.length ? editData.checklist : buildChecklist(cat));
    setShowList(true);
  }, [open, editData]);

  useBackButtonClose(open, onClose);

  const handleCategoryChange = (id) => {
    setCategory(id);
    setChecklist(buildChecklist(id));
  };

  const toggleCheck = useCallback((key) => setChecklist(prev =>
    prev.map(i => i.key === key ? { ...i, checked: !i.checked } : i)
  ), []);

  const setNote = useCallback((key, val) => setChecklist(prev =>
    prev.map(i => i.key === key ? { ...i, note: val } : i)
  ), []);

  const handleSave = () => {
    if (!text.trim() && !person.trim() && !checklist.some(i => i.checked)) {
      toast.error('Please fill in at least one field.'); return;
    }
    onSave({
      id:           editData?.id           || Date.now().toString(),
      text:         text.trim(),
      person:       person.trim(),
      category,
      dateAdded,
      checklist,
      answered:     editData?.answered     || false,
      dateAnswered: editData?.dateAnswered || null,
      praise:       editData?.praise       || '',
    });
    onClose();
  };

  const checkedCount = checklist.filter(i => i.checked).length;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl overflow-hidden border-stone-200 dark:border-stone-700"
        onPointerDownOutside={preventSelectClose}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10"
          style={{ background: 'linear-gradient(135deg, #1c1917 0%, #14532d 60%, #ca8a04 100%)' }}>
          <DialogTitle className="font-serif text-xl font-bold text-white">
            {editData ? 'Edit Prayer' : '✦ New Prayer Request'}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs mt-0.5 font-serif italic">
            "In everything, by prayer and petition, with thanksgiving…" — Phil 4:6
          </DialogDescription>
        </div>

        <div className="p-5 space-y-5">
          {/* Person */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Person / Topic <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="e.g. Juan dela Cruz, our church plant…" className={IC} />
          </div>

          {/* General request */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">General Request</Label>
            <Tx value={text} onChange={e => setText(e.target.value)}
              placeholder="Write a summary of your prayer request…" rows={2} />
          </div>

          {/* Category */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Category</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => handleCategoryChange(c.id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    category === c.id
                      ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400'
                      : 'border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}>
                  <c.Icon className="w-3.5 h-3.5 shrink-0" />{c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prayer Checklist */}
          <div>
            <button onClick={() => setShowList(v => !v)}
              className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold cursor-pointer">
                  Prayer Checklist
                </Label>
                {checkedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-400 text-[9px] font-bold">
                    {checkedCount} selected
                  </span>
                )}
              </div>
              {showList ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {showList && (
              <div className="space-y-2 rounded-xl border border-stone-100 dark:border-stone-700 p-3 bg-stone-50/50 dark:bg-stone-900/20">
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-2">
                  Check what you want to pray for · add a personal note to each
                </p>
                {checklist.map(item => (
                  <div key={item.key}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      item.checked
                        ? 'border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-900/20'
                        : 'border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800'
                    }`}>
                    <button onClick={() => toggleCheck(item.key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                      {item.checked
                        ? <CheckSquare className="w-4 h-4 text-forest-500 shrink-0" />
                        : <Square className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${
                          item.checked ? 'text-forest-700 dark:text-forest-400' : 'text-stone-600 dark:text-stone-400'
                        }`}>{item.label}</p>
                        {!item.checked && (
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{item.prompt}</p>
                        )}
                      </div>
                    </button>
                    {item.checked && (
                      <div className="px-3 pb-3">
                        <Tx value={item.note}
                          onChange={e => setNote(item.key, e.target.value)}
                          placeholder={item.prompt}
                          rows={2}
                          className="text-xs bg-white dark:bg-stone-800" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Started</Label>
            <Input type="date" value={dateAdded} onChange={e => setDateAdded(e.target.value)} className={IC} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose}
              className="flex-1 rounded-xl border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400">
              Cancel
            </Button>
            <Button onClick={handleSave}
              className="flex-1 bg-forest-500 hover:bg-forest-700 text-white rounded-xl font-medium">
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
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-stone-200 dark:border-stone-700">
        <div className="px-6 py-5 border-b border-white/10"
          style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)' }}>
          <DialogTitle className="font-serif text-xl font-bold text-white">🙌 Praise God!</DialogTitle>
          <DialogDescription className="text-white/50 text-xs mt-0.5 line-clamp-1">
            {request?.person ? `"${request.person}" — ` : ''}{request?.text}
          </DialogDescription>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">Date Answered</Label>
            <Input type="date" value={dateAnswered} onChange={e => setDateAnswered(e.target.value)} className={IC} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-1.5 block">
              Testimony / Praise <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Tx value={praise} onChange={e => setPraise(e.target.value)}
              placeholder="How did God answer? Write your testimony…" rows={4} className="font-serif" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}
              className="flex-1 rounded-xl border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400">
              Cancel
            </Button>
            <Button onClick={() => { onSave({ dateAnswered, praise: praise.trim() }); onClose(); }}
              className="flex-1 bg-forest-500 hover:bg-forest-700 text-white rounded-xl">
              ✅ Mark as Answered
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
  const cat = getCat(req.category);
  const checkedCount = useMemo(
    () => (req.checklist || []).filter(i => i.checked).length,
    [req.checklist]
  );

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      req.answered
        ? 'bg-forest-50/60 dark:bg-forest-900/10 border-forest-200 dark:border-forest-800'
        : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
            req.answered ? 'bg-forest-500' : 'bg-rose-400 animate-pulse'
          }`} />

          <div className="flex-1 min-w-0">
            {req.person && (
              <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-0.5">{req.person}</p>
            )}
            {req.text && (
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">{req.text}</p>
            )}
            {req.answered && req.praise && (
              <div className="mt-2 pl-3 border-l-2 border-forest-400">
                <p className="text-xs text-forest-700 dark:text-forest-400 italic leading-relaxed">"{req.praise}"</p>
              </div>
            )}

            {checkedCount > 0 && (
              <button onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-forest-600 dark:text-forest-400 hover:opacity-80 transition-opacity">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <CheckSquare className="w-3 h-3" />
                {checkedCount} prayer {checkedCount === 1 ? 'area' : 'areas'}
              </button>
            )}
            {expanded && <ChecklistDisplay checklist={req.checklist} />}

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
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
                className="w-7 h-7 flex items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 dark:hover:bg-forest-900/50 text-forest-600 dark:text-forest-400 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => onUnmark(req.id)} title="Move back to ongoing"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-400 transition-colors">
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

/* ── Praise Card ─────────────────────────────────────────────────────────── */
const PraiseCard = memo(({ req, onDelete }) => {
  const cat = getCat(req.category);
  return (
    <div className="rounded-2xl border bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #166534, #ca8a04)' }} />
      <div className="p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <Star className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
        </div>
        <div className="flex-1 min-w-0">
          {req.person && <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-0.5">{req.person}</p>}
          {req.text   && <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">{req.text}</p>}
          {req.praise && (
            <div className="mt-2.5 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800">
              <p className="text-[10px] font-bold text-forest-700 dark:text-forest-400 uppercase tracking-widest mb-1">🙌 Praise</p>
              <p className="text-sm text-forest-800 dark:text-forest-300 italic leading-relaxed font-serif">"{req.praise}"</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Started {fmtDate(req.dateAdded)}
            </span>
            {req.dateAnswered && (
              <span className="text-[10px] text-forest-600 dark:text-forest-400 flex items-center gap-1 font-medium">
                <CheckCheck className="w-3 h-3" /> {fmtDate(req.dateAnswered)}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(req.id)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
PraiseCard.displayName = 'PraiseCard';

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const PrayerJournal = () => {
  const { isTablet } = useScreenSize();
  const [requests, setRequests] = useLocalStorage('prayerRequests_v2', []);

  const [view,         setView]         = useState('ongoing');
  const [filterCat,    setFilterCat]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [showAnswered, setShowAnswered] = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [markTarget,   setMarkTarget]   = useState(null);

  /* ── Actions ── */
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

  /* ── Derived lists ── */
  const [ongoing, answered] = useMemo(() => [
    requests.filter(r => !r.answered),
    requests.filter(r =>  r.answered),
  ], [requests]);

  const filter = useCallback((list) => {
    const q = search.trim().toLowerCase();
    return list
      .filter(r => filterCat === 'all' || r.category === filterCat)
      .filter(r => !q || [r.person, r.text, ...(r.checklist || []).map(i => i.note)].join(' ').toLowerCase().includes(q));
  }, [filterCat, search]);

  const filteredOngoing  = useMemo(() => filter(ongoing),  [filter, ongoing]);
  const filteredAnswered = useMemo(() => filter(answered), [filter, answered]);

  /* ── Header ── */
  const header = (
    <div className="relative overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(150deg, #1c1917 0%, #14532d 50%, #ca8a04 100%)' }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: '#ca8a04' }} />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-mango-300 text-[10px] uppercase tracking-[0.25em] font-bold mb-1">Church Planting Prayer</p>
            <h1 className={`font-serif font-bold text-white tracking-tight leading-none ${isTablet ? 'text-4xl' : 'text-3xl'}`}>
              Prayer Journal
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-mango-300" />
          </div>
        </div>
        <p className="text-white/40 text-xs mt-2 font-serif italic">
          "Call to me and I will answer you." — Jer 33:3
        </p>
        <div className="flex gap-2 mt-5">
          {[
            { n: ongoing.length,  label: 'Ongoing',  color: '#fca5a5' },
            { n: answered.length, label: 'Answered', color: '#86efac' },
            { n: requests.length, label: 'Total',    color: '#fcd34d' },
          ].map(s => (
            <div key={s.label}
              className="flex-1 rounded-xl py-3 px-2 text-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xl font-black font-serif" style={{ color: s.color }}>{s.n}</p>
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Category filter bar ── */
  const categoryFilterBar = (
    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => setFilterCat(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
            filterCat === cat.id
              ? 'bg-forest-500 border-forest-500 text-white shadow-sm'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
          }`}>
          <cat.Icon className="w-3 h-3" />{cat.label}
        </button>
      ))}
    </div>
  );

  /* ── View toggle ── */
  const viewToggle = (
    <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
      {[
        { id: 'ongoing', label: 'Ongoing', Icon: Flame, count: ongoing.length,  activeColor: 'text-rose-600 dark:text-rose-400'    },
        { id: 'praises', label: 'Praises', Icon: Star,  count: answered.length, activeColor: 'text-forest-600 dark:text-forest-400' },
      ].map(t => (
        <button key={t.id} onClick={() => setView(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            view === t.id
              ? `bg-white dark:bg-stone-700 ${t.activeColor} shadow-sm`
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}>
          <t.Icon className="w-3.5 h-3.5" />{t.label} ({t.count})
        </button>
      ))}
    </div>
  );

  /* ── Ongoing view ── */
  const ongoingView = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-stone-600" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search prayers, people…"
          className="pl-9 text-xs border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100" />
      </div>

      {categoryFilterBar}

      <Card className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm">Ongoing Prayers</h3>
            <span className="text-xs text-stone-400 dark:text-stone-500">({filteredOngoing.length})</span>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}
            className="h-7 px-3 rounded-lg bg-forest-500 hover:bg-forest-700 text-white text-xs gap-1">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="p-3 space-y-2">
          {filteredOngoing.length > 0 ? filteredOngoing.map(req => (
            <RequestCard key={req.id} req={req}
              onMarkAnswered={openMark} onDelete={handleDelete}
              onUnmark={handleUnmark}  onEdit={openEdit} />
          )) : (
            <div className="text-center py-10 text-stone-400 dark:text-stone-500">
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No ongoing prayer requests</p>
              <button onClick={() => setAddOpen(true)} className="mt-1 text-xs text-forest-500 hover:text-forest-700 font-medium">
                + Add one
              </button>
            </div>
          )}
        </div>
      </Card>

      {filteredAnswered.length > 0 && (
        <Card className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
          <button onClick={() => setShowAnswered(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-400" />
              <h3 className="font-serif font-semibold text-stone-700 dark:text-stone-300 text-sm">
                Answered <span className="text-xs text-stone-400 dark:text-stone-500 font-normal">({filteredAnswered.length})</span>
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

  /* ── Praises view ── */
  const praisesView = (
    <div className="space-y-3">
      {answered.length === 0 ? (
        <Card className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
          <div className="text-center py-14 text-stone-400 dark:text-stone-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No answered prayers yet</p>
            <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              Mark prayers as answered and they'll appear here as testimony.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #fefce8)', border: '1px solid #bbf7d0' }}>
            <CheckCheck className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
            <p className="text-xs text-forest-800 italic font-serif leading-relaxed">
              "He who calls you is faithful; he will surely do it." — 1 Thess 5:24
            </p>
          </div>
          {answered.map(req => <PraiseCard key={req.id} req={req} onDelete={handleDelete} />)}
        </>
      )}
    </div>
  );

  /* ── Tablet side panel ── */
  const sidePanel = (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-700">
          <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-sm">Prayer Stats</p>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Total Requests', value: requests.length },
            { label: 'Still Believing', value: ongoing.length  },
            { label: 'Answered',        value: answered.length },
            { label: 'Answer Rate',     value: requests.length ? `${Math.round((answered.length / requests.length) * 100)}%` : '—' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-stone-500 dark:text-stone-400">{s.label}</span>
              <span className="font-serif font-bold text-stone-900 dark:text-stone-100">{s.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border p-4 space-y-2"
        style={{ background: 'linear-gradient(135deg, #f0fdf4, #fefce8)', borderColor: '#d9f99d' }}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-forest-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-forest-700">Today's Encouragement</p>
        </div>
        <p className="text-sm text-forest-800 italic font-serif leading-relaxed">
          "Do not be anxious about anything, but in every situation, by prayer and petition,
          with thanksgiving, present your requests to God."
        </p>
        <p className="text-xs text-forest-600 font-semibold">— Philippians 4:6</p>
      </div>

      <Button onClick={() => setAddOpen(true)}
        className="w-full h-12 bg-forest-500 hover:bg-forest-700 text-white rounded-2xl font-serif text-base gap-2">
        <Plus className="w-4 h-4" /> New Prayer Request
      </Button>
    </div>
  );

  return (
    <>
      <RequestDialog open={addOpen || !!editTarget} onClose={closeModal} onSave={handleSave} editData={editTarget} />
      <MarkAnsweredDialog open={!!markTarget} request={markTarget} onClose={() => setMarkTarget(null)} onSave={handleMarkAnswered} />

      {isTablet ? (
        <div className="space-y-6">
          {header}
          <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
            <div className="space-y-4">
              {viewToggle}
              {view === 'ongoing' ? ongoingView : praisesView}
            </div>
            {sidePanel}
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
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all active:scale-95 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #14532d, #ca8a04)' }}>
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default PrayerJournal;