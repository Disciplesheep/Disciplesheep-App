import React, { useState } from 'react';
import { format } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { Wallet, Plus, TrendingDown, TrendingUp, AlertCircle, Edit2, Trash2, HandCoins, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, EXPENSE_CATEGORIES, MONTHLY_BUDGET_PHP, MONTHLY_BUDGET_USD, USD_TO_PHP } from '@/utils/dateUtils';

const ExpenseLedger = () => {
  const { expenses, setExpenses } = useJournalData();

  const [supportList, setSupportList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('supportReceived') || '[]'); }
    catch { return []; }
  });
  const saveSupport = (list) => {
    setSupportList(list);
    localStorage.setItem('supportReceived', JSON.stringify(list));
  };

  const [isAddDialogOpen, setIsAddDialogOpen]         = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [editingId, setEditingId]                     = useState(null);
  const [editingSupportId, setEditingSupportId]       = useState(null);
  const [selectedMonth, setSelectedMonth]             = useState(format(new Date(), 'yyyy-MM'));

  const emptyExpense = { date: formatDate(new Date()), category: '', item: '', php: '', usd: '' };
  const emptySupport = { date: formatDate(new Date()), from: '', php: '', usd: '', note: '' };

  const [formData, setFormData]       = useState(emptyExpense);
  const [supportForm, setSupportForm] = useState(emptySupport);

  const resetForm    = () => { setFormData(emptyExpense);   setEditingId(null); };
  const resetSupport = () => { setSupportForm(emptySupport); setEditingSupportId(null); };

  const handlePhpChange        = (v) => setFormData({ ...formData, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' });
  const handleUsdChange        = (v) => setFormData({ ...formData, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' });
  const handleSupportPhpChange = (v) => setSupportForm({ ...supportForm, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' });
  const handleSupportUsdChange = (v) => setSupportForm({ ...supportForm, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' });

  const handleSubmit = () => {
    if (!formData.category || !formData.item || !formData.php) { toast.error('Please fill in Category, Item, and Amount'); return; }
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? { ...formData, id: editingId } : e));
      toast.success('Expense updated!');
    } else {
      setExpenses(prev => [{ ...formData, id: Date.now().toString() }, ...prev]);
      toast.success('Expense recorded!');
    }
    resetForm();
    setIsAddDialogOpen(false);
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
    resetSupport();
    setIsSupportDialogOpen(false);
  };

  const handleEdit          = (e) => { setFormData(e);    setEditingId(e.id);        setIsAddDialogOpen(true); };
  const handleEditSupport   = (s) => { setSupportForm(s); setEditingSupportId(s.id); setIsSupportDialogOpen(true); };
  const handleDelete        = (id) => { setExpenses(prev => prev.filter(e => e.id !== id)); toast.success('Expense removed'); };
  const handleDeleteSupport = (id) => { saveSupport(supportList.filter(s => s.id !== id)); toast.success('Support entry removed'); };

  /* ── Calculations ── */
  const monthExpenses    = expenses.filter(e => e.date?.startsWith(selectedMonth));
  const monthSupport     = supportList.filter(s => s.date?.startsWith(selectedMonth));

  const totalSpentPhp    = monthExpenses.reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const totalSpentUsd    = monthExpenses.reduce((sum, e) => sum + parseFloat(e.usd || 0), 0);
  const totalSupportPhp  = monthSupport.reduce((sum, s)  => sum + parseFloat(s.php || 0), 0);
  const totalSupportUsd  = monthSupport.reduce((sum, s)  => sum + parseFloat(s.usd || 0), 0);

  // Budget = only what's received
  const effectiveBudgetPhp = totalSupportPhp;
  const effectiveBudgetUsd = totalSupportUsd;
  const remainingPhp       = effectiveBudgetPhp - totalSpentPhp;
  const remainingUsd       = effectiveBudgetUsd - totalSpentUsd;

  // Progress bar 1: how much of received support has been spent
  const spentPercentage = effectiveBudgetPhp > 0
    ? Math.min((totalSpentPhp / effectiveBudgetPhp) * 100, 100)
    : 0;

  // Progress bar 2: how close received support is to the target
  const targetPercentage = Math.min((totalSupportPhp / MONTHLY_BUDGET_PHP) * 100, 100);

  const categoryTotals = monthExpenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + parseFloat(e.php || 0);
    return acc;
  }, {});

  const ic = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <Card className="bg-gradient-to-br from-mango-500 to-mango-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight mb-1">Budget Ledger</h1>
            <p className="text-white/70 text-sm">Target: ₱{MONTHLY_BUDGET_PHP.toLocaleString()} / ${MONTHLY_BUDGET_USD} / month</p>
          </div>
          <Wallet className="w-12 h-12 text-white/30" />
        </div>

        <p className="text-xs text-white/60 mb-1 uppercase tracking-widest">
          {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
        </p>

        {/* Progress bar 1 — Spending vs Received */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-white/80">Spent vs Received</span>
            <span className="font-mono font-bold text-sm">
              ₱{totalSpentPhp.toLocaleString()} / ₱{totalSupportPhp.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                spentPercentage > 90 ? 'bg-red-400' :
                spentPercentage > 75 ? 'bg-yellow-400' : 'bg-white'
              }`}
              style={{ width: `${spentPercentage}%` }}
            />
          </div>
          <p className="text-xs text-white/60 mt-1 text-right">{spentPercentage.toFixed(0)}% of received support spent</p>
        </div>

        {/* Progress bar 2 — Support received vs Target */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-white/80 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Support vs Target
            </span>
            <span className="font-mono font-bold text-sm">
              ${totalSupportUsd.toFixed(0)} / ${MONTHLY_BUDGET_USD}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-green-400"
              style={{ width: `${targetPercentage}%` }}
            />
          </div>
          <p className="text-xs text-white/60 mt-1 text-right">
            {targetPercentage.toFixed(0)}% of monthly target received
            {targetPercentage >= 100 && ' 🎉'}
          </p>
        </div>
      </Card>

      {/* Month Selector + Buttons */}
      <div className="flex gap-2">
        <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className={`${ic} rounded-xl flex-1`} />

        {/* Support button */}
        <Dialog open={isSupportDialogOpen} onOpenChange={o => { setIsSupportDialogOpen(o); if (!o) resetSupport(); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4">
              <HandCoins className="w-4 h-4 mr-1" /> Support
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingSupportId ? 'Edit Support' : 'Record Support Received'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Date Received</Label>
                <Input type="date" value={supportForm.date} onChange={e => setSupportForm({ ...supportForm, date: e.target.value })} className={ic} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">From (Sender / Source) *</Label>
                <Input type="text" value={supportForm.from} onChange={e => setSupportForm({ ...supportForm, from: e.target.value })}
                  placeholder="e.g. Home church, Pastor Juan, Anonymous" className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">PHP *</Label>
                  <Input type="number" step="0.01" value={supportForm.php} onChange={e => handleSupportPhpChange(e.target.value)}
                    placeholder="0.00" className={`${ic} font-mono`} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">USD</Label>
                  <Input type="number" step="0.01" value={supportForm.usd} onChange={e => handleSupportUsdChange(e.target.value)}
                    placeholder="0.00" className={`${ic} font-mono`} />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Note (optional)</Label>
                <Input type="text" value={supportForm.note} onChange={e => setSupportForm({ ...supportForm, note: e.target.value })}
                  placeholder="e.g. Monthly support, One-time gift" className={ic} />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Exchange rate: ₱{USD_TO_PHP} = $1</p>
              <Button onClick={handleSupportSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-11">
                {editingSupportId ? 'Update Support' : 'Record Support'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense button */}
        <Dialog open={isAddDialogOpen} onOpenChange={o => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-4">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={ic} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Category *</Label>
                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className={ic}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Item / Description *</Label>
                <Input type="text" value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })}
                  placeholder="What did you spend on?" className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">PHP *</Label>
                  <Input type="number" step="0.01" value={formData.php} onChange={e => handlePhpChange(e.target.value)}
                    placeholder="0.00" className={`${ic} font-mono`} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">USD</Label>
                  <Input type="number" step="0.01" value={formData.usd} onChange={e => handleUsdChange(e.target.value)}
                    placeholder="0.00" className={`${ic} font-mono`} />
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
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">
            {remainingPhp >= 0 ? 'Remaining' : 'Over Budget'}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">${Math.abs(remainingUsd).toFixed(2)}</p>
        </Card>
      </div>

      {/* Support Received Summary Card */}
      <Card className={`rounded-xl border p-5 ${totalSupportPhp > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className={`w-5 h-5 ${totalSupportPhp > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-400'}`} />
          <h3 className={`font-semibold text-sm ${totalSupportPhp > 0 ? 'text-green-800 dark:text-green-300' : 'text-stone-500 dark:text-stone-400'}`}>
            Support Received This Month
          </h3>
        </div>
        <p className={`text-3xl font-bold font-mono mb-1 ${totalSupportPhp > 0 ? 'text-green-700 dark:text-green-400' : 'text-stone-400 dark:text-stone-500'}`}>
          ₱{totalSupportPhp.toLocaleString()}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          ${totalSupportUsd.toFixed(2)} · target is ${MONTHLY_BUDGET_USD} / ₱{MONTHLY_BUDGET_PHP.toLocaleString()}
        </p>
      </Card>

      {/* Budget Alert */}
      {effectiveBudgetPhp > 0 && spentPercentage > 75 && (
        <Card className={`rounded-xl p-4 border ${spentPercentage > 90 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={spentPercentage > 90 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'} />
            <div>
              <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                {spentPercentage > 90 ? 'Budget Alert!' : 'Budget Warning'}
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {spentPercentage > 90
                  ? 'You have spent over 90% of your received support this month.'
                  : 'You have spent over 75% of your received support this month.'}
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

      {/* Support Received List */}
      {monthSupport.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Support Received</h3>
          {monthSupport.map(s => (
            <Card key={s.id} className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 font-medium">
                      From: {s.from}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{format(new Date(s.date), 'MMM dd')}</span>
                  </div>
                  {s.note && <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">{s.note}</p>}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">+₱{parseFloat(s.php).toFixed(2)}</span>
                    <span className="font-mono text-sm text-stone-500 dark:text-stone-400">+${parseFloat(s.usd).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditSupport(s)}
                    className="text-stone-600 dark:text-stone-400 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSupport(s.id)}
                    className="text-stone-600 dark:text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
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
        ) : (
          monthExpenses.map(expense => (
            <Card key={expense.id} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      {expense.category}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{format(new Date(expense.date), 'MMM dd')}</span>
                  </div>
                  <p className="text-sm text-stone-900 dark:text-stone-100 font-medium mb-1">{expense.item}</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">₱{parseFloat(expense.php).toFixed(2)}</span>
                    <span className="font-mono text-sm text-stone-600 dark:text-stone-400">${parseFloat(expense.usd).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}
                    className="text-stone-600 dark:text-stone-400 hover:text-forest-600 dark:hover:text-forest-400">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}
                    className="text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseLedger;