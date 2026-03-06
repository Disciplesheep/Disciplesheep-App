import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { BookOpen, Users, Wallet, Plus, Calendar, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDisplayDate, formatDayOfWeek, getWeekNumber, DAILY_TASKS, EXPENSE_CATEGORIES, GENERATIONS, USD_TO_PHP } from '@/utils/dateUtils';
import { useScreenSize } from '@/hooks/useScreenSize';

const progressColor = (pct) => {
  if (pct <= 100) {
    const hue = Math.round((pct / 100) * 120);
    return `hsl(${hue}, 72%, 42%)`;
  }
  const over = Math.min(pct - 100, 50);
  const hue = Math.round(120 - (over / 50) * 75);
  return `hsl(${hue}, 80%, 42%)`;
};

const budgetColor = (rawPct) => {
  if (rawPct > 100) return 'hsl(0, 72%, 42%)';
  const hue = Math.round((rawPct / 100) * 120);
  return `hsl(${hue}, 72%, 42%)`;
};

const ic = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

const getGenerationFromAge = (age) => {
  const a = parseInt(age);
  if (isNaN(a)) return '';
  if (a <= 12)  return 'Alpha';
  if (a <= 27)  return 'Gen Z';
  if (a <= 43)  return 'Millennial';
  if (a <= 59)  return 'Gen X';
  if (a <= 77)  return 'Boomer';
  return 'Silent';
};

const getAgeFromBirthday = (birthday) => {
  if (!birthday) return '';
  const b = new Date(birthday + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age > 0 ? String(age) : '';
};

const focusNext = (ref) => {
  const form = ref?.closest('[data-form]');
  if (!form) return;
  const fields = Array.from(form.querySelectorAll('input, select, textarea, button[data-focusable]'));
  const idx = fields.indexOf(ref);
  if (idx >= 0 && idx < fields.length - 1) fields[idx + 1]?.focus();
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isTablet } = useScreenSize();
  const today = new Date();
  const todayKey = formatDate(today);
  const { dailyEntries, setDailyEntries, peopleContacts, setPeopleContacts, expenses, setExpenses } = useJournalData();

  // ── Add Expense ─────────────────────────────────────────────────────────────
  const emptyExpense = { date: formatDate(new Date()), category: '', item: '', php: '', usd: '' };
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm]     = useState(emptyExpense);

  const refExpDate = useRef();
  const refExpCat  = useRef(); // ← category trigger ref
  const refExpItem = useRef();
  const refExpPhp  = useRef();
  const refExpUsd  = useRef();

  const handleExpensePhp = (v) => setExpenseForm(f => ({ ...f, php: v, usd: v ? (parseFloat(v) / USD_TO_PHP).toFixed(2) : '' }));
  const handleExpenseUsd = (v) => setExpenseForm(f => ({ ...f, usd: v, php: v ? (parseFloat(v) * USD_TO_PHP).toFixed(2) : '' }));

  const handleExpenseSubmit = () => {
    if (!expenseForm.category || !expenseForm.item || !expenseForm.php) {
      toast.error('Please fill in Category, Item, and Amount');
      return;
    }
    setExpenses(prev => [{ ...expenseForm, id: Date.now().toString() }, ...prev]);
    toast.success('Expense recorded!');
    setExpenseForm(emptyExpense);
    setIsExpenseOpen(false);
  };

  const onExpEnter = (ref) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(ref.current); }
  };

  // ── Add Person ──────────────────────────────────────────────────────────────
  const emptyPerson = {
    date: formatDate(new Date()), name: '', age: '', birthday: '',
    generation: '', contactNumber: '', facebookUrl: '', address: '',
    connection: '', topic: '', nextStep: '', contactFrequencyDays: 7,
  };
  const [isPersonOpen, setIsPersonOpen] = useState(false);
  const [personForm, setPersonForm]     = useState(emptyPerson);

  const refPDate       = useRef(); const refPName       = useRef();
  const refPAge        = useRef(); const refPBirthday   = useRef();
  const refPPhone      = useRef(); const refPAddress    = useRef();
  const refPFacebook   = useRef(); const refPConnection = useRef();
  const refPTopic      = useRef(); const refPNextStep   = useRef();
  const refPFrequency  = useRef();

  const onPersonEnter = (ref) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(ref.current); }
  };

  const handleBirthdayChange = (val) => {
    const age = getAgeFromBirthday(val);
    const generation = age ? getGenerationFromAge(age) : personForm.generation;
    setPersonForm(f => ({ ...f, birthday: val, age, generation }));
    setTimeout(() => refPPhone.current?.focus(), 100);
  };

  const handleAgeChange = (val) => {
    const generation = getGenerationFromAge(val);
    setPersonForm(f => ({ ...f, age: val, generation }));
  };

  const handlePersonSubmit = () => {
    if (!personForm.name || !personForm.generation) {
      toast.error('Please fill in Name and Generation');
      return;
    }
    setPeopleContacts(prev => [{ ...personForm, id: Date.now().toString() }, ...prev]);
    toast.success('New contact added!');
    setPersonForm(emptyPerson);
    setIsPersonOpen(false);
  };

  // ── Custom Tasks ────────────────────────────────────────────────────────────
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskInput, setNewTaskInput]   = useState('');

  const handleAddCustomTask = () => {
    const trimmed = newTaskInput.trim();
    if (!trimmed) { toast.error('Please enter a task name'); return; }
    const current = dailyEntries[todayKey] || { tasks: [], customTasks: [] };
    const customTasks = current.customTasks || [];
    if (customTasks.includes(trimmed) || DAILY_TASKS.includes(trimmed)) {
      toast.error('Task already exists'); return;
    }
    setDailyEntries(prev => ({
      ...prev,
      [todayKey]: { ...current, customTasks: [...customTasks, trimmed], updatedAt: new Date().toISOString() },
    }));
    toast.success('Task added!');
    setNewTaskInput('');
    setIsAddTaskOpen(false);
  };

  const handleDeleteCustomTask = (task) => {
    const current = dailyEntries[todayKey] || { tasks: [], customTasks: [] };
    setDailyEntries(prev => ({
      ...prev,
      [todayKey]: {
        ...current,
        customTasks: (current.customTasks || []).filter(t => t !== task),
        tasks: (current.tasks || []).filter(t => t !== task),
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const todayEntry = dailyEntries[todayKey] || { tasks: [], customTasks: [] };
  const allTasks = [...DAILY_TASKS, ...(todayEntry.customTasks || [])];
  const completedTasks = todayEntry.tasks?.length || 0;
  const totalTasks = allTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskToggle = (task) => {
    const current = dailyEntries[todayKey] || { tasks: [] };
    const newTasks = current.tasks.includes(task)
      ? current.tasks.filter(t => t !== task)
      : [...current.tasks, task];
    setDailyEntries(prev => ({
      ...prev,
      [todayKey]: { ...current, tasks: newTasks, updatedAt: new Date().toISOString() },
    }));
  };

  const todayPeople   = peopleContacts.filter(p => p.date === todayKey).length;
  const todayExpenses = expenses.filter(e => e.date === todayKey)
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);

  const currentMonth = format(today, 'yyyy-MM');
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const monthlyBudget       = 11400;
  const rawBudgetPercentage = Math.round((monthExpenses / monthlyBudget) * 100);
  const budgetPercentage    = Math.min(rawBudgetPercentage, 100);

  const field = (label, children) => (
    <div>
      <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">{label}</Label>
      {children}
    </div>
  );

  // ── UI Sections ─────────────────────────────────────────────────────────────
  const headerContent = (
    <div className="relative overflow-hidden rounded-2xl text-white"
      style={{
        backgroundImage: 'linear-gradient(rgba(15,81,50,0.9),rgba(15,81,50,0.7)),url(https://images.unsplash.com/photo-1690462666233-c710b82d3aef?crop=entropy&cs=srgb&fm=jpg&q=85)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding: isTablet ? '2.5rem' : '1.75rem 1.5rem',
      }}
      data-testid="dashboard-header">
      <div className="relative z-10">
        <h1 className={`font-serif font-bold tracking-tight mb-2 ${isTablet ? 'text-4xl' : 'text-3xl'}`}>Disciplesheep Journal</h1>
        <p className={`text-white/90 font-medium ${isTablet ? 'text-xl' : 'text-lg'}`}>{formatDisplayDate(today)}</p>
        <p className="text-white/70 text-sm mt-1">{formatDayOfWeek(today)} &bull; Week {getWeekNumber(today)}</p>
      </div>
    </div>
  );

  const taskCard = (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="task-progress-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`font-serif font-semibold text-stone-900 dark:text-stone-100 ${isTablet ? 'text-2xl' : 'text-xl'}`}>Today's Tasks</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">{completedTasks} of {totalTasks} completed</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle cx="32" cy="32" r="28" className="stroke-stone-200 dark:stroke-stone-600" strokeWidth="6" fill="none" />
            <circle cx="32" cy="32" r="28" style={{ stroke: progressColor(completionPercentage) }}
              strokeWidth="6" fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - completedTasks / totalTasks)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: progressColor(completionPercentage) }}>{completionPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {DAILY_TASKS.map((task, idx) => (
          <div key={idx} className="flex items-center gap-2 cursor-pointer py-0.5" onClick={() => handleTaskToggle(task)}>
            <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${todayEntry.tasks.includes(task) ? 'bg-forest-500 border-forest-500' : 'bg-white border-stone-300 dark:bg-stone-700 dark:border-stone-500'}`}>
              {todayEntry.tasks.includes(task) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`text-sm flex-1 transition-colors ${todayEntry.tasks.includes(task) ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'}`}>{task}</span>
          </div>
        ))}
        {(todayEntry.customTasks || []).map((task, idx) => (
          <div key={`c-${idx}`} className="flex items-center gap-2 py-0.5 group">
            <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${todayEntry.tasks.includes(task) ? 'bg-forest-500 border-forest-500' : 'bg-white border-stone-300 dark:bg-stone-700 dark:border-stone-500'}`}
              onClick={() => handleTaskToggle(task)}>
              {todayEntry.tasks.includes(task) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`text-sm flex-1 transition-colors cursor-pointer ${todayEntry.tasks.includes(task) ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'}`} onClick={() => handleTaskToggle(task)}>{task}</span>
            <button onClick={() => handleDeleteCustomTask(task)} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-0.5 rounded" style={{ minHeight: 0 }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {isAddTaskOpen ? (
        <div className="flex gap-2 mb-4">
          <Input autoFocus value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCustomTask(); if (e.key === 'Escape') { setIsAddTaskOpen(false); setNewTaskInput(''); } }}
            placeholder="Enter task name..." className="h-9 text-sm dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          <Button onClick={handleAddCustomTask} className="h-9 bg-forest-500 hover:bg-forest-900 text-white px-3 rounded-lg shrink-0">Add</Button>
          <Button variant="ghost" onClick={() => { setIsAddTaskOpen(false); setNewTaskInput(''); }} className="h-9 px-2 rounded-lg shrink-0"><X className="w-4 h-4" /></Button>
        </div>
      ) : (
        <button onClick={() => setIsAddTaskOpen(true)}
          className="flex items-center gap-1.5 text-xs text-forest-600 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 mb-4 transition-colors"
          style={{ minHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Plus className="w-3.5 h-3.5" /> Add a task
        </button>
      )}

      <Button onClick={() => navigate('/journal')} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-12 font-serif" data-testid="open-journal-btn">
        <BookOpen className="w-4 h-4 mr-2" /> Open Today's Journal
      </Button>
    </Card>
  );

  const statsGrid = (
    <div className="grid gap-4 grid-cols-2">
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 px-4 py-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/stewardship/people')} data-testid="people-stat-card">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-forest-500 dark:text-forest-400 shrink-0" />
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">People Today</p>
          <p className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 ml-auto">{todayPeople}</p>
        </div>
      </Card>
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 px-4 py-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/stewardship/expenses')} data-testid="expense-stat-card">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-mango-500 shrink-0" />
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Spent Today</p>
          <p className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 ml-auto">₱{todayExpenses.toFixed(0)}</p>
        </div>
      </Card>
      {isTablet && (
        <>
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/discipleship')}>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{completedTasks}</p>
            <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Tasks Done</p>
          </Card>
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/stewardship/reports')}>
            <Calendar className="w-6 h-6 text-purple-500 mb-3" />
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">₱{monthExpenses.toFixed(0)}</p>
            <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Month Spend</p>
          </Card>
        </>
      )}
    </div>
  );

  const budgetCard = (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 px-4 py-2" data-testid="budget-progress-card">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-base">Monthly Budget</h3>
        <span className="text-xs font-mono text-stone-600 dark:text-stone-400">₱{monthExpenses.toFixed(0)} / ₱{monthlyBudget}</span>
      </div>
      <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${budgetPercentage}%`, backgroundColor: budgetColor(rawBudgetPercentage) }} />
      </div>
      <p className="text-xs mt-1" style={{ color: budgetColor(rawBudgetPercentage) }}>
        {rawBudgetPercentage}% used &bull; ₱{(monthlyBudget - monthExpenses).toFixed(0)} remaining
      </p>
    </Card>
  );

  const quickActions = (
    <div className="grid gap-3 grid-cols-2">
      <Button variant="outline" onClick={() => setIsPersonOpen(true)}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
        data-testid="quick-add-person-btn">
        <Plus className="w-4 h-4 mr-2" /> Add Person
      </Button>
      <Button variant="outline" onClick={() => setIsExpenseOpen(true)}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
        data-testid="quick-add-expense-btn">
        <Plus className="w-4 h-4 mr-2" /> Add Expense
      </Button>
      {isTablet && (
        <>
          <Button variant="outline" onClick={() => navigate('/journal')} className="h-16 text-base border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100">
            <BookOpen className="w-4 h-4 mr-2" /> Open Journal
          </Button>
          <Button variant="outline" onClick={() => navigate('/stewardship/reports')} className="h-16 text-base border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100">
            <Calendar className="w-4 h-4 mr-2" /> View Reports
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Add Expense Dialog ── */}
      <Dialog open={isExpenseOpen} onOpenChange={o => {
        setIsExpenseOpen(o);
        if (!o) setExpenseForm(emptyExpense);
        // Focus category when dialog opens
        if (o) setTimeout(() => refExpCat.current?.focus(), 120);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1" data-form>
            {field('Date',
              <Input ref={refExpDate} type="date" value={expenseForm.date}
                onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                onKeyDown={onExpEnter(refExpDate)} className={ic} />
            )}
            {field('Category *',
              <Select value={expenseForm.category} onValueChange={v => {
                setExpenseForm(f => ({ ...f, category: v }));
                setTimeout(() => refExpItem.current?.focus(), 100);
              }}>
                <SelectTrigger ref={refExpCat} className={ic}><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {field('Item / Description *',
              <Input ref={refExpItem} type="text" value={expenseForm.item}
                onChange={e => setExpenseForm(f => ({ ...f, item: e.target.value }))}
                onKeyDown={onExpEnter(refExpItem)} placeholder="What did you spend on?" className={ic} />
            )}
            <div className="grid grid-cols-2 gap-3">
              {field('PHP *',
                <Input ref={refExpPhp} type="number" step="0.01" value={expenseForm.php}
                  onChange={e => handleExpensePhp(e.target.value)}
                  onKeyDown={onExpEnter(refExpPhp)} placeholder="0.00" className={`${ic} font-mono`} />
              )}
              {field('USD',
                <Input ref={refExpUsd} type="number" step="0.01" value={expenseForm.usd}
                  onChange={e => handleExpenseUsd(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleExpenseSubmit(); } }}
                  placeholder="0.00" className={`${ic} font-mono`} />
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Exchange rate: ₱{USD_TO_PHP} = $1</p>
            <Button onClick={handleExpenseSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Person Dialog ── */}
      <Dialog open={isPersonOpen} onOpenChange={o => { setIsPersonOpen(o); if (!o) setPersonForm(emptyPerson); }}>
        <DialogContent className={isTablet ? 'max-w-2xl' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1" data-form>

            {field('Date contacted',
              <Input ref={refPDate} type="date" value={personForm.date}
                onChange={e => setPersonForm(f => ({ ...f, date: e.target.value }))}
                onKeyDown={onPersonEnter(refPDate)} className={ic} />
            )}

            {field('Name *',
              <Input ref={refPName} type="text" value={personForm.name} placeholder="Full name" autoFocus
                onChange={e => setPersonForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={onPersonEnter(refPName)} className={ic} />
            )}

            <div className="grid grid-cols-2 gap-4">
              {field('Age',
                <Input ref={refPAge} type="number" min="1" max="120" value={personForm.age} placeholder="e.g. 24"
                  onChange={e => handleAgeChange(e.target.value)}
                  onKeyDown={onPersonEnter(refPAge)} className={`${ic} font-mono`} />
              )}
              {field('Birthday',
                <Input ref={refPBirthday} type="date" value={personForm.birthday}
                  onChange={e => handleBirthdayChange(e.target.value)}
                  className={ic} />
              )}
            </div>

            {field('Generation *',
              <Select value={personForm.generation} onValueChange={v => {
                setPersonForm(f => ({ ...f, generation: v }));
                setTimeout(() => refPPhone.current?.focus(), 100);
              }}>
                <SelectTrigger className={ic}><SelectValue placeholder="Select generation" /></SelectTrigger>
                <SelectContent>
                  {GENERATIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {field('Contact Number',
              <Input ref={refPPhone} type="tel" value={personForm.contactNumber} placeholder="e.g. 09171234567"
                onChange={e => setPersonForm(f => ({ ...f, contactNumber: e.target.value }))}
                onKeyDown={onPersonEnter(refPPhone)} className={ic} />
            )}

            {field('Address',
              <Input ref={refPAddress} type="text" value={personForm.address} placeholder="e.g. Brgy. San Jose, Puerto Princesa"
                onChange={e => setPersonForm(f => ({ ...f, address: e.target.value }))}
                onKeyDown={onPersonEnter(refPAddress)} className={ic} />
            )}

            {field('Facebook Profile Link',
              <Input ref={refPFacebook} type="text" value={personForm.facebookUrl} placeholder="e.g. https://facebook.com/username"
                onChange={e => setPersonForm(f => ({ ...f, facebookUrl: e.target.value }))}
                onKeyDown={onPersonEnter(refPFacebook)} className={ic} />
            )}

            {field('How Connected',
              <Input ref={refPConnection} type="text" value={personForm.connection} placeholder="e.g. WPU campus, Coffee shop"
                onChange={e => setPersonForm(f => ({ ...f, connection: e.target.value }))}
                onKeyDown={onPersonEnter(refPConnection)} className={ic} />
            )}

            {field('Conversation Topic',
              <Input ref={refPTopic} type="text" value={personForm.topic} placeholder="What did you discuss?"
                onChange={e => setPersonForm(f => ({ ...f, topic: e.target.value }))}
                onKeyDown={onPersonEnter(refPTopic)} className={ic} />
            )}

            {field('Next Step',
              <Input ref={refPNextStep} type="text" value={personForm.nextStep} placeholder="Follow-up action"
                onChange={e => setPersonForm(f => ({ ...f, nextStep: e.target.value }))}
                onKeyDown={onPersonEnter(refPNextStep)} className={ic} />
            )}

            {field('Contact Frequency (days)',
              <>
                <Input ref={refPFrequency} type="number" min="1" max="365" value={personForm.contactFrequencyDays}
                  onChange={e => setPersonForm(f => ({ ...f, contactFrequencyDays: parseInt(e.target.value) || 7 }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePersonSubmit(); } }}
                  placeholder="Days between follow-ups" className={`${ic} font-mono`} />
                <p className="text-xs text-stone-400 mt-1">How often to follow up · Press Enter to save</p>
              </>
            )}

            <Button onClick={handlePersonSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Layout ── */}
      {isTablet ? (
        <div className="space-y-6">
          {headerContent}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">{taskCard}{budgetCard}</div>
            <div className="space-y-6">{statsGrid}{quickActions}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {headerContent}
          {taskCard}
          {statsGrid}
          {budgetCard}
          {quickActions}
        </div>
      )}
    </>
  );
};

export default Dashboard;