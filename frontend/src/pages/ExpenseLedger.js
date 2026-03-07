import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { Wallet, Plus, TrendingDown, TrendingUp, AlertCircle, Edit2, Trash2, HandCoins, Target, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, EXPENSE_CATEGORIES, MONTHLY_BUDGET_PHP, MONTHLY_BUDGET_USD, USD_TO_PHP } from '@/utils/dateUtils';
import DeleteGuardDialog from '@/components/DeleteGuardDialog';

/* ── Auto-focus next field helper (text fields only) ──────────────────────── */
const focusNext = (currentRef) => {
  const form = currentRef?.closest('[data-form]');
  if (!form) return;
  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  const idx = fields.indexOf(currentRef);
  if (idx >= 0 && idx < fields.length - 1) fields[idx + 1]?.focus();
};

// Only use onEnter for text/date fields — NOT number inputs (mobile keyboards
// fire Enter-like keydown events after each digit, causing unwanted advance)
const onEnter = (ref) => (e) => {
  if (e.key === 'Enter') { e.preventDefault(); focusNext(ref.current); }
};

const ExpenseLedger = () => {
  const { expenses, setExpenses } = useJournalData();
  const location = useLocation();

  const [fabVisible, setFabVisible] = useState(true);
  const scrollTimer = useRef(null);
  useEffect(() => {
    const handleScroll = () => {
      setFabVisible(false);
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setFabVisible(true), 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimer.current); };
  }, []);

  useEffect(() => {
    if (location.state?.openForm) {
      setIsAddDialogOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const [supportList, setSupportList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('supportReceived') || '[]'); } catch { return []; }
  });
  const saveSupport = (list) => { setSupportList(list); localStorage.setItem('supportReceived', JSON.stringify(list)); };

  const [giftList, setGiftList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oneTimeGifts') || '[]'); } catch { return []; }
  });
  const saveGifts = (list) => { setGiftList(list); localStorage.setItem('oneTimeGifts', JSON.stringify(list)); };

  const [isAddDialogOpen,     setIsAddDialogOpen]     = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isGiftDialogOpen,    setIsGiftDialogOpen]    = useState(false);
  const [editingId,           setEditingId]           = useState(null);
  const [editingSupportId,    setEditingSupportId]    = useState(null);
  const [editingGiftId,       setEditingGiftId]       = useState(null);
  const [selectedMonth,       setSelectedMonth]       = useState(format(new Date(), 'yyyy-MM'));
  const [pending,             setPending]             = useState(null);

  const emptyExpense = { date: formatDate(new Date()), category: '', item: '', php: '', usd: '' };
  const emptySupport = { date: formatDate(new Date()), from: '', php: '', usd: '', note: '' };
  const emptyGift    = { date: formatDate(new Date()), from: '', php: '', usd: '', note: '' };

  const [formData,    setFormData]    = useState(emptyExpense);
  const [supportForm, setSupportForm] = useState(emptySupport);
  const [giftForm,    setGiftForm]    = useState(emptyGift);

  // Expense form refs
  const refExpDate = useRef(); const refExpItem = useRef();
  const refExpPhp  = useRef(); const refExpUsd  = useRef();

  // Support/Gift form refs
  const refSupDate = useRef(); const refSupFrom = useRef();
  const refSupPhp  = useRef(); const refSupUsd  = useRef(); const refSupNote = useRef();
  const refGiftDate = useRef(); const refGiftFrom = useRef();
  const refGiftPhp  = useRef(); const refGiftUsd  = useRef(); const refGiftNote = useRef();

  const resetForm    = () => { setFormData(emptyExpense);    setEditingId(null); };
  const resetSupport = () => { setSupportForm(emptySupport); setEditingSupportId(null); };
  const resetGift    = () => { setGiftForm(emptyGift);       setEditingGiftId(null); };

  const handlePhpChange        = (v) => setFormData({ ...formData, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' });
  const handleUsdChange        = (v) => setFormData({ ...formData, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' });
  const handleSupportPhpChange = (v) => setSupportForm({ ...supportForm, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' });
  const handleSupportUsdChange = (v) => setSupportForm({ ...supportForm, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' });
  const handleGiftPhpChange    = (v) => setGiftForm({ ...giftForm, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' });
  const handleGiftUsdChange    = (v) => setGiftForm({ ...giftForm, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' });

  const handleSubmit = () => {
    if (!formData.category || !formData.item || !formData.php) { toast.error('Please fill in Category, Item, and Amount'); return; }
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? { ...formData, id: editingId } : e));
      toast.success('Expense updated!');
    } else {
      setExpenses(prev => [{ ...formData, id: Date.now().toString() }, ...prev]);
      toast.success('Expense recorded!');
    }
    resetForm(); setIsAddDialogOpen(false);
  };

  const handleSupportSubmit = () => {
    if (!supportForm.from || !supportForm.php) { toast.error('Please fill in From and Amount'); return; }
    if (editingSupportId) {
      saveSupport(supportList.map(s => s.id === editingSupportId ? { ...supportForm, id: editingSupportId } : s));
      toast.success('Support updated!');
    } else {
      saveSupport([{ ...supportForm, id: Date.now().toString() }, ...supportList]);
      toast.success('Support received recorded!');
    }
    resetSupport(); setIsSupportDialogOpen(false);
  };

  const handleGiftSubmit = () => {
    if (!giftForm.from || !giftForm.php) { toast.error('Please fill in From and Amount'); return; }
    if (editingGiftId) {
      saveGifts(giftList.map(g => g.id === editingGiftId ? { ...giftForm, id: editingGiftId } : g));
      toast.success('Gift updated!');
    } else {
      saveGifts([{ ...giftForm, id: Date.now().toString() }, ...giftList]);
      toast.success('One-time gift recorded!');
    }
    resetGift(); setIsGiftDialogOpen(false);
  };

  const handleEdit        = (e) => { setFormData(e);    setEditingId(e.id);        setIsAddDialogOpen(true); };
  const handleEditSupport = (s) => { setSupportForm(s); setEditingSupportId(s.id); setIsSupportDialogOpen(true); };
  const handleEditGift    = (g) => { setGiftForm(g);    setEditingGiftId(g.id);    setIsGiftDialogOpen(true); };

  const handleDelete        = (expense) => setPending({ type: 'expense', id: expense.id, label: `"${expense.item}"` });
  const handleDeleteSupport = (s)       => setPending({ type: 'support', id: s.id,       label: `support from ${s.from}` });
  const handleDeleteGift    = (g)       => setPending({ type: 'gift',    id: g.id,       label: `gift from ${g.from}` });

  const confirmDelete = () => {
    if (!pending) return;
    if (pending.type === 'expense') { setExpenses(prev => prev.filter(e => e.id !== pending.id)); toast.success('Expense removed'); }
    else if (pending.type === 'support') { saveSupport(supportList.filter(s => s.id !== pending.id)); toast.success('Support entry removed'); }
    else if (pending.type === 'gift')    { saveGifts(giftList.filter(g => g.id !== pending.id));     toast.success('Gift entry removed'); }
    setPending(null);
  };

  const monthExpenses   = expenses.filter(e => e.date?.startsWith(selectedMonth));
  const monthSupport    = supportList.filter(s => s.date?.startsWith(selectedMonth));
  const monthGifts      = giftList.filter(g => g.date?.startsWith(selectedMonth));

  const totalSpentPhp   = monthExpenses.reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const totalSpentUsd   = monthExpenses.reduce((sum, e) => sum + parseFloat(e.usd || 0), 0);
  const totalSupportPhp = monthSupport.reduce((sum, s)  => sum + parseFloat(s.php || 0), 0);
  const totalSupportUsd = monthSupport.reduce((sum, s)  => sum + parseFloat(s.usd || 0), 0);
  const totalGiftsPhp   = monthGifts.reduce((sum, g)    => sum + parseFloat(g.php || 0), 0);
  const totalGiftsUsd   = monthGifts.reduce((sum, g)    => sum + parseFloat(g.usd || 0), 0);

  const remainingPhp    = totalSupportPhp - totalSpentPhp;
  const remainingUsd    = totalSupportUsd - totalSpentUsd;
  const spentPercentage = totalSupportPhp > 0 ? Math.min((totalSpentPhp / totalSupportPhp) * 100, 100) : 0;
  const targetPercentage = Math.min((totalSupportPhp / MONTHLY_BUDGET_PHP) * 100, 100);

  const categoryTotals = monthExpenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + parseFloat(e.php || 0);
    return acc;
  }, {});

  const ic = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

  // Support/Gift form — onEnter only on text/date fields, NOT number inputs
  const SupportFormFields = ({ form, setForm, onPhpChange, onUsdChange, onSubmit, isEditing, refs }) => (
    <div className="space-y-4 mt-4" data-form>
      <div>
        <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Date Received</Label>
        <Input ref={refs.date} type="date" value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          onKeyDown={onEnter(refs.date)} className={ic} />
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">From (Sender / Source) *</Label>
        <Input ref={refs.from} type="text" value={form.from}
          onChange={e => setForm({ ...form, from: e.target.value })}
          onKeyDown={onEnter(refs.from)}
          placeholder="e.g. Home church, Pastor Juan, Anonymous" className={ic} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">PHP *</Label>
          {/* No onKeyDown here — number inputs on mobile fire Enter after each digit */}
          <Input ref={refs.php} type="number" step="0.01" value={form.php}
            onChange={e => onPhpChange(e.target.value)}
            placeholder="0.00" className={`${ic} font-mono`} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">USD</Label>
          {/* No onKeyDown here — number inputs on mobile fire Enter after each digit */}
          <Input ref={refs.usd} type="number" step="0.01" value={form.usd}
            onChange={e => onUsdChange(e.target.value)}
            placeholder="0.00" className={`${ic} font-mono`} />
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Note (optional)</Label>
        <Input ref={refs.note} type="text" value={form.note}
          onChange={e => setForm({ ...form, note: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } }}
          placeholder="e.g. Birthday gift, Special offering · Press Enter to save" className={ic} />
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">Exchange rate: ₱{USD_TO_PHP} = $1</p>
      <Button onClick={onSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
        {isEditing ? 'Update' : 'Record'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">

      <DeleteGuardDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        label={pending?.label || 'this record'}
      />

      {/* ── Floating Action Buttons ── */}
      <div className={`fixed right-16 top-[62%] z-40 flex flex-col gap-6 items-center transition-all duration-150 ${fabVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'}`}>

        {/* Support */}
        <Dialog open={isSupportDialogOpen} onOpenChange={o => { setIsSupportDialogOpen(o); if (!o) resetSupport(); }}>
          <DialogTrigger asChild>
            <button title="Record Monthly Support"
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 active:scale-95 text-white shadow-lg shadow-green-900/30 flex items-center justify-center transition-all">
              <HandCoins className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingSupportId ? 'Edit Support' : 'Record Monthly Support'}</DialogTitle>
            </DialogHeader>
            <SupportFormFields form={supportForm} setForm={setSupportForm}
              onPhpChange={handleSupportPhpChange} onUsdChange={handleSupportUsdChange}
              onSubmit={handleSupportSubmit} isEditing={!!editingSupportId}
              refs={{ date: refSupDate, from: refSupFrom, php: refSupPhp, usd: refSupUsd, note: refSupNote }} />
          </DialogContent>
        </Dialog>

        {/* Gift */}
        <Dialog open={isGiftDialogOpen} onOpenChange={o => { setIsGiftDialogOpen(o); if (!o) resetGift(); }}>
          <DialogTrigger asChild>
            <button title="Record One-Time Gift"
              className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all">
              <Gift className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingGiftId ? 'Edit Gift' : 'Record One-Time Gift'}</DialogTitle>
            </DialogHeader>
            <SupportFormFields form={giftForm} setForm={setGiftForm}
              onPhpChange={handleGiftPhpChange} onUsdChange={handleGiftUsdChange}
              onSubmit={handleGiftSubmit} isEditing={!!editingGiftId}
              refs={{ date: refGiftDate, from: refGiftFrom, php: refGiftPhp, usd: refGiftUsd, note: refGiftNote }} />
          </DialogContent>
        </Dialog>

        {/* Add Expense */}
        <Dialog open={isAddDialogOpen} onOpenChange={o => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <button title="Add New Expense"
              className="w-14 h-14 rounded-full bg-forest-500 hover:bg-forest-600 active:scale-95 text-white shadow-lg shadow-forest-900/30 flex items-center justify-center transition-all">
              <Plus className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4" data-form>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Date</Label>
                <Input ref={refExpDate} type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  onKeyDown={onEnter(refExpDate)} className={ic} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Category *</Label>
                <Select value={formData.category} onValueChange={v => {
                  setFormData({ ...formData, category: v });
                  setTimeout(() => refExpItem.current?.focus(), 100);
                }}>
                  <SelectTrigger className={ic}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Item / Description *</Label>
                <Input ref={refExpItem} type="text" value={formData.item}
                  onChange={e => setFormData({ ...formData, item: e.target.value })}
                  onKeyDown={onEnter(refExpItem)}
                  placeholder="What did you spend on?" className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">PHP *</Label>
                  {/* No onKeyDown — number inputs fire Enter-like events on mobile after each digit */}
                  <Input ref={refExpPhp} type="number" step="0.01" value={formData.php}
                    onChange={e => handlePhpChange(e.target.value)}
                    placeholder="0.00" className={`${ic} font-mono`} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">USD</Label>
                  {/* No onKeyDown — number inputs fire Enter-like events on mobile after each digit */}
                  <Input ref={refExpUsd} type="number" step="0.01" value={formData.usd}
                    onChange={e => handleUsdChange(e.target.value)}
                    placeholder="0.00 · Press Enter to save" className={`${ic} font-mono`} />
                </div>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Exchange rate: ₱{USD_TO_PHP} = $1</p>
              <Button onClick={handleSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
                {editingId ? 'Update Expense' : 'Add Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Header */}
      <Card className="bg-gradient-to-br from-mango-500 to-mango-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight mb-1">Budget Ledger</h1>
            <p className="text-white/70 text-sm">Target: ₱{MONTHLY_BUDGET_PHP.toLocaleString()} / ${MONTHLY_BUDGET_USD} / month</p>
          </div>
          <Wallet className="w-12 h-12 text-white/30" />
        </div>
        <p className="text-xs text-white/60 mb-3 uppercase tracking-widest">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-white/80">Spent vs Received</span>
            <span className="font-mono font-bold text-sm">₱{totalSpentPhp.toLocaleString()} / ₱{totalSupportPhp.toLocaleString()}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${spentPercentage > 90 ? 'bg-red-400' : spentPercentage > 75 ? 'bg-yellow-400' : 'bg-white'}`}
              style={{ width: `${spentPercentage}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-1 text-right">{spentPercentage.toFixed(0)}% of received support spent</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-white/80 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Support vs Target</span>
            <span className="font-mono font-bold text-sm">${totalSupportUsd.toFixed(0)} / ${MONTHLY_BUDGET_USD}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full transition-all bg-green-400" style={{ width: `${targetPercentage}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-1 text-right">{targetPercentage.toFixed(0)}% of monthly target received{targetPercentage >= 100 && ' 🎉'}</p>
        </div>
      </Card>

      {/* Month Selector */}
      <div className="flex gap-2 flex-wrap">
        <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className={`${ic} rounded-xl flex-1 min-w-[130px]`} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5">
          <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">₱{totalSpentPhp.toFixed(0)}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Spent This Month</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">${totalSpentUsd.toFixed(2)}</p>
        </Card>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5">
          <Wallet className={`w-5 h-5 mb-2 ${remainingPhp >= 0 ? 'text-forest-500 dark:text-forest-400' : 'text-red-500'}`} />
          <p className={`text-2xl font-bold font-mono ${remainingPhp >= 0 ? 'text-forest-500 dark:text-forest-400' : 'text-red-500'}`}>
            ₱{Math.abs(remainingPhp).toFixed(0)}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">{remainingPhp >= 0 ? 'Remaining' : 'Over Budget'}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">${Math.abs(remainingUsd).toFixed(2)}</p>
        </Card>
      </div>

      {/* Budget Alert */}
      {totalSupportPhp > 0 && spentPercentage > 75 && (
        <Card className={`rounded-xl p-4 border ${spentPercentage > 90 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={spentPercentage > 90 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'} />
            <div>
              <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">{spentPercentage > 90 ? 'Budget Alert!' : 'Budget Warning'}</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {spentPercentage > 90 ? 'You have spent over 90% of your received support this month.' : 'You have spent over 75% of your received support this month.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([category, amount]) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-700 dark:text-stone-300">{category}</span>
                  <span className="font-mono font-medium text-stone-900 dark:text-stone-100">₱{amount.toFixed(0)}</span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalSpentPhp > 0 ? (amount / totalSpentPhp) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Monthly Support List */}
      {monthSupport.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Monthly Support</h3>
            <span className="ml-auto font-mono font-bold text-green-700 dark:text-green-400">₱{totalSupportPhp.toLocaleString()}</span>
          </div>
          {monthSupport.map(s => (
            <Card key={s.id} className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 font-medium">From: {s.from}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{format(new Date(s.date), 'MMM dd')}</span>
                  </div>
                  {s.note && <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">{s.note}</p>}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">+₱{parseFloat(s.php).toFixed(2)}</span>
                    <span className="font-mono text-sm text-stone-500 dark:text-stone-400">+${parseFloat(s.usd).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditSupport(s)} className="text-stone-600 dark:text-stone-400 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSupport(s)} className="text-stone-600 dark:text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* One-Time Gifts List */}
      {monthGifts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">One-Time Gifts</h3>
            <span className="ml-auto font-mono font-bold text-purple-700 dark:text-purple-400">₱{totalGiftsPhp.toLocaleString()}</span>
          </div>
          <Card className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-4 mb-1">
            <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1"><Gift className="w-3 h-3" /> One-time gifts are tracked separately and do not affect your monthly budget.</p>
          </Card>
          {monthGifts.map(g => (
            <Card key={g.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-300 font-medium">From: {g.from}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{format(new Date(g.date), 'MMM dd')}</span>
                  </div>
                  {g.note && <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">{g.note}</p>}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">+₱{parseFloat(g.php).toFixed(2)}</span>
                    <span className="font-mono text-sm text-stone-500 dark:text-stone-400">+${parseFloat(g.usd).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditGift(g)} className="text-stone-600 dark:text-stone-400 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteGift(g)} className="text-stone-600 dark:text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Recent Expenses</h3>
        {monthExpenses.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-12 text-center">
            <Wallet className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-600 dark:text-stone-400">No expenses recorded for this month</p>
          </Card>
        ) : monthExpenses.map(expense => (
          <Card key={expense.id} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">{expense.category}</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{format(new Date(expense.date), 'MMM dd')}</span>
                </div>
                <p className="text-sm text-stone-900 dark:text-stone-100 font-medium mb-1">{expense.item}</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">₱{parseFloat(expense.php).toFixed(2)}</span>
                  <span className="font-mono text-sm text-stone-600 dark:text-stone-400">${parseFloat(expense.usd).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)} className="text-stone-600 dark:text-stone-400 hover:text-forest-600 dark:hover:text-forest-400"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(expense)} className="text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExpenseLedger;