import React from 'react';
import { format } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { CheckCircle2, BookOpen, Users, Wallet, Plus, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDisplayDate, formatDayOfWeek, getWeekNumber, DAILY_TASKS } from '@/utils/dateUtils';
import { useScreenSize } from '@/hooks/useScreenSize';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isTablet } = useScreenSize();
  const today = new Date();
  const todayKey = formatDate(today);
  const { dailyEntries, peopleContacts, expenses } = useJournalData();

  const todayEntry = dailyEntries[todayKey] || { tasks: [] };
  const completedTasks = todayEntry.tasks?.length || 0;
  const totalTasks = DAILY_TASKS.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const todayPeople = peopleContacts.filter(p => p.date === todayKey).length;
  const todayExpenses = expenses.filter(e => e.date === todayKey)
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);

  const currentMonth = format(today, 'yyyy-MM');
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const monthlyBudget = 11400;
  const budgetPercentage = Math.min(Math.round((monthExpenses / monthlyBudget) * 100), 100);

  const headerContent = (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        backgroundImage: 'linear-gradient(rgba(15, 81, 50, 0.9), rgba(15, 81, 50, 0.7)), url(https://images.unsplash.com/photo-1690462666233-c710b82d3aef?crop=entropy&cs=srgb&fm=jpg&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: isTablet ? '2.5rem' : '1.75rem 1.5rem',
      }}
      data-testid="dashboard-header"
    >
      <div className="relative z-10">
        <h1 className={`font-serif font-bold tracking-tight mb-2 ${isTablet ? 'text-4xl' : 'text-3xl'}`}>
          Disciplesheep Journal
        </h1>
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
            <circle
              cx="32" cy="32" r="28"
              className="stroke-forest-500"
              strokeWidth="6" fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - completedTasks / totalTasks)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-forest-500 dark:text-forest-400">{completionPercentage}%</span>
          </div>
        </div>
      </div>
      <Button
        onClick={() => navigate('/journal')}
        className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-12 font-serif"
        data-testid="open-journal-btn"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Open Today's Journal
      </Button>
    </Card>
  );

  const statsGrid = (
    <div className={`grid gap-4 ${isTablet ? 'grid-cols-2' : 'grid-cols-2'}`}>
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/stewardship/people')}
        data-testid="people-stat-card"
      >
        <Users className="w-6 h-6 text-forest-500 dark:text-forest-400 mb-3" />
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{todayPeople}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">People Today</p>
      </Card>
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/stewardship/expenses')}
        data-testid="expense-stat-card"
      >
        <Wallet className="w-6 h-6 text-mango-500 mb-3" />
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">₱{todayExpenses.toFixed(0)}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Spent Today</p>
      </Card>
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/discipleship')}
      >
        <CheckCircle2 className="w-6 h-6 text-blue-500 mb-3" />
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{completedTasks}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Tasks Done</p>
      </Card>
      <Card
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/stewardship/reports')}
      >
        <Calendar className="w-6 h-6 text-purple-500 mb-3" />
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">₱{monthExpenses.toFixed(0)}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Month Spend</p>
      </Card>
    </div>
  );

  const budgetCard = (
    <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6" data-testid="budget-progress-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-serif font-semibold text-stone-900 dark:text-stone-100 ${isTablet ? 'text-xl' : 'text-lg'}`}>Monthly Budget</h3>
        <span className="text-sm font-mono text-stone-600 dark:text-stone-400">₱{monthExpenses.toFixed(0)} / ₱{monthlyBudget}</span>
      </div>
      <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            budgetPercentage > 90 ? 'bg-red-500' :
            budgetPercentage > 75 ? 'bg-yellow-500' :
            'bg-forest-500'
          }`}
          style={{ width: `${budgetPercentage}%` }}
        />
      </div>
      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
        {budgetPercentage}% used &bull; ₱{(monthlyBudget - monthExpenses).toFixed(0)} remaining
      </p>
    </Card>
  );

  const quickActions = (
    <div className={`grid gap-3 ${isTablet ? 'grid-cols-4' : 'grid-cols-2'}`}>
      <Button
        variant="outline"
        onClick={() => navigate('/stewardship/people')}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
        data-testid="quick-add-person-btn"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Person
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate('/stewardship/expenses')}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
        data-testid="quick-add-expense-btn"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate('/journal')}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Open Journal
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate('/stewardship/reports')}
        className={`border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 ${isTablet ? 'h-16 text-base' : 'h-14'}`}
      >
        <Calendar className="w-4 h-4 mr-2" />
        View Reports
      </Button>
    </div>
  );

  if (isTablet) {
    return (
      <div className="space-y-6">
        {headerContent}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            {taskCard}
            {budgetCard}
          </div>
          <div className="space-y-6">
            {statsGrid}
            {quickActions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {headerContent}
      {taskCard}
      {statsGrid}
      {budgetCard}
      {quickActions}
    </div>
  );
};

export default Dashboard;
