import React, { useState } from 'react';
import { format } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { Wallet, Plus, TrendingDown, AlertCircle, Edit2, Trash2 } from 'lucide-react';
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    category: '',
    item: '',
    php: '',
    usd: ''
  });

  const resetForm = () => {
    setFormData({
      date: formatDate(new Date()),
      category: '',
      item: '',
      php: '',
      usd: ''
    });
    setEditingId(null);
  };

  const handlePhpChange = (value) => {
    setFormData({
      ...formData,
      php: value,
      usd: value ? (parseFloat(value) / USD_TO_PHP).toFixed(2) : ''
    });
  };

  const handleUsdChange = (value) => {
    setFormData({
      ...formData,
      usd: value,
      php: value ? (parseFloat(value) * USD_TO_PHP).toFixed(2) : ''
    });
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.item || !formData.php) {
      toast.error('Please fill in Category, Item, and Amount');
      return;
    }

    if (editingId) {
      setExpenses(prev => 
        prev.map(e => e.id === editingId ? { ...formData, id: editingId } : e)
      );
      toast.success('Expense updated!');
    } else {
      const newExpense = {
        ...formData,
        id: Date.now().toString()
      };
      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Expense recorded!');
    }
    
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (expense) => {
    setFormData(expense);
    setEditingId(expense.id);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense removed');
  };

  // Calculate month stats
  const monthExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
  const totalPhp = monthExpenses.reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const totalUsd = monthExpenses.reduce((sum, e) => sum + parseFloat(e.usd || 0), 0);
  const remainingPhp = MONTHLY_BUDGET_PHP - totalPhp;
  const remainingUsd = MONTHLY_BUDGET_USD - totalUsd;
  const budgetPercentage = Math.min((totalPhp / MONTHLY_BUDGET_PHP) * 100, 100);

  // Category breakdown
  const categoryTotals = monthExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(expense.php || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-mango-500 to-mango-900 rounded-2xl p-8 text-white shadow-lg" data-testid="expense-ledger-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Budget Ledger</h1>
            <p className="text-white/80">₱{MONTHLY_BUDGET_PHP} / ${MONTHLY_BUDGET_USD} monthly</p>
          </div>
          <Wallet className="w-12 h-12 text-white/30" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Month: {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</span>
            <span className="font-mono font-bold">{budgetPercentage.toFixed(0)}% used</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                budgetPercentage > 90 ? 'bg-red-400' : 
                budgetPercentage > 75 ? 'bg-yellow-400' : 
                'bg-white'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Month Selector and Add Button */}
      <div className="flex gap-3">
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 rounded-xl flex-1"
          data-testid="month-selector"
        />
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-6"
              data-testid="add-expense-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="add-expense-dialog">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingId ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                  data-testid="expense-date-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100" data-testid="expense-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">Item / Description *</Label>
                <Input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="What did you spend on?"
                  className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                  data-testid="expense-item-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">PHP *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.php}
                    onChange={(e) => handlePhpChange(e.target.value)}
                    placeholder="0.00"
                    className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 font-mono"
                    data-testid="expense-php-input"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">USD</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.usd}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="0.00"
                    className="border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 font-mono"
                    data-testid="expense-usd-input"
                  />
                </div>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Exchange rate: ₱{USD_TO_PHP} = $1</p>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11"
                data-testid="submit-expense-btn"
              >
                {editingId ? 'Update Expense' : 'Add Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5" data-testid="spent-card">
          <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">₱{totalPhp.toFixed(0)}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Spent This Month</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">${totalUsd.toFixed(2)}</p>
        </Card>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5" data-testid="remaining-card">
          <Wallet className={`w-5 h-5 mb-2 ${remainingPhp >= 0 ? 'text-forest-500 dark:text-forest-400' : 'text-red-500'}`} />
          <p className={`text-2xl font-bold font-mono ${remainingPhp >= 0 ? 'text-forest-500 dark:text-forest-400' : 'text-red-500'}`}>
            ₱{Math.abs(remainingPhp).toFixed(0)}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">{remainingPhp >= 0 ? 'Remaining' : 'Over Budget'}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">${Math.abs(remainingUsd).toFixed(2)}</p>
        </Card>
      </div>

      {/* Budget Alert */}
      {budgetPercentage > 75 && (
        <Card className={`rounded-xl p-4 border ${
          budgetPercentage > 90 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`} data-testid="budget-alert">
          <div className="flex items-start gap-3">
            <AlertCircle className={budgetPercentage > 90 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'} />
            <div>
              <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                {budgetPercentage > 90 ? 'Budget Alert!' : 'Budget Warning'}
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {budgetPercentage > 90 
                  ? 'You have used over 90% of your monthly budget. Exercise caution with remaining expenses.'
                  : 'You have used over 75% of your monthly budget. Monitor your spending carefully.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="category-breakdown-card">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / totalPhp) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-700 dark:text-stone-300">{category}</span>
                      <span className="font-mono font-medium text-stone-900 dark:text-stone-100">₱{amount.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2">
                      <div 
                        className="bg-forest-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Recent Expenses</h3>
        {monthExpenses.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-12 text-center" data-testid="empty-expenses">
            <Wallet className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-600 dark:text-stone-400">No expenses recorded for this month</p>
          </Card>
        ) : (
          monthExpenses.map(expense => (
            <Card key={expense.id} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4 hover:shadow-md transition-shadow" data-testid={`expense-card-${expense.id}`}>
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(expense)}
                    className="text-stone-600 dark:text-stone-400 hover:text-forest-600 dark:hover:text-forest-400"
                    data-testid={`edit-expense-${expense.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                    data-testid={`delete-expense-${expense.id}`}
                  >
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