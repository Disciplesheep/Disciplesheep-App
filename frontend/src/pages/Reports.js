import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { FileText, Calendar, TrendingUp, Users, Wallet, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatDate, getWeekNumber, getMonthNumber, MONTHLY_BUDGET_PHP } from '@/utils/dateUtils';

const Reports = () => {
  const { dailyEntries, peopleContacts, expenses } = useJournalData();
  const [selectedTab, setSelectedTab] = useState('weekly');

  // Weekly Report Data
  const generateWeeklyData = () => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekDates = [];
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        weekDates.push(formatDate(new Date(d)));
      }
      
      const weekPeople = peopleContacts.filter(p => weekDates.includes(p.date)).length;
      const weekExpenses = expenses
        .filter(e => weekDates.includes(e.date))
        .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
      
      const completedTasks = weekDates.reduce((sum, date) => {
        const entry = dailyEntries[date];
        return sum + (entry?.tasks?.length || 0);
      }, 0);
      
      weeks.push({
        week: `W${getWeekNumber(weekStart)}`,
        people: weekPeople,
        expenses: Math.round(weekExpenses),
        tasks: completedTasks,
        label: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`
      });
    }
    
    return weeks;
  };

  // Monthly Report Data
  const generateMonthlyData = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthPeople = peopleContacts.filter(p => p.date?.startsWith(monthKey)).length;
      const monthExpenses = expenses
        .filter(e => e.date?.startsWith(monthKey))
        .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
      
      const daysInMonth = [];
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        daysInMonth.push(formatDate(new Date(d)));
      }
      
      const completedDays = daysInMonth.filter(date => {
        const entry = dailyEntries[date];
        return entry && (entry.passage || entry.tasks?.length > 0);
      }).length;
      
      months.push({
        month: format(monthDate, 'MMM'),
        people: monthPeople,
        expenses: Math.round(monthExpenses),
        daysCompleted: completedDays,
        label: format(monthDate, 'MMMM yyyy')
      });
    }
    
    return months;
  };

  const weeklyData = generateWeeklyData();
  const monthlyData = generateMonthlyData();

  // Current Week Summary
  const currentWeekData = weeklyData[weeklyData.length - 1];
  
  // Current Month Summary
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const currentMonthPeople = peopleContacts.filter(p => p.date?.startsWith(currentMonthKey)).length;
  const currentMonthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonthKey))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
  const budgetUsagePercent = Math.round((currentMonthExpenses / MONTHLY_BUDGET_PHP) * 100);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-500 to-forest-900 rounded-2xl p-8 text-white shadow-lg" data-testid="reports-header">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <h1 className="font-serif text-3xl font-bold tracking-tight">Reports</h1>
        </div>
        <p className="text-white/80">Track your faithfulness across time</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-4" data-testid="total-people-stat">
          <Users className="w-5 h-5 text-forest-500 mb-2" />
          <p className="text-xl font-bold font-mono text-stone-900">{peopleContacts.length}</p>
          <p className="text-xs text-stone-600">Total People</p>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-4" data-testid="total-expenses-stat">
          <Wallet className="w-5 h-5 text-mango-500 mb-2" />
          <p className="text-xl font-bold font-mono text-stone-900">
            ₱{expenses.reduce((sum, e) => sum + parseFloat(e.php || 0), 0).toFixed(0)}
          </p>
          <p className="text-xs text-stone-600">Total Spent</p>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-4" data-testid="total-entries-stat">
          <CheckCircle className="w-5 h-5 text-forest-500 mb-2" />
          <p className="text-xl font-bold font-mono text-stone-900">{Object.keys(dailyEntries).length}</p>
          <p className="text-xs text-stone-600">Journal Days</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-stone-100 rounded-xl p-1" data-testid="report-tabs">
          <TabsTrigger 
            value="weekly" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-forest-500"
            data-testid="weekly-tab"
          >
            Weekly Reports
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-forest-500"
            data-testid="monthly-tab"
          >
            Monthly Reports
          </TabsTrigger>
        </TabsList>

        {/* Weekly Reports */}
        <TabsContent value="weekly" className="space-y-6 mt-6">
          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="weekly-summary-card">
            <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">Current Week Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold font-mono text-forest-500">{currentWeekData.people}</p>
                <p className="text-xs text-stone-600 uppercase">People Contacted</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-stone-900">{currentWeekData.tasks}</p>
                <p className="text-xs text-stone-600 uppercase">Tasks Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-mango-500">₱{currentWeekData.expenses}</p>
                <p className="text-xs text-stone-600 uppercase">Spent</p>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-4">{currentWeekData.label}</p>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="weekly-people-chart">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">People Contacted (Last 6 Weeks)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: '8px' }}
                  labelStyle={{ color: '#1C1917', fontWeight: 'bold' }}
                />
                <Bar dataKey="people" fill="#0F5132" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="weekly-expenses-chart">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">Weekly Expenses (PHP)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: '8px' }}
                  labelStyle={{ color: '#1C1917', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="expenses" stroke="#D97706" strokeWidth={3} dot={{ fill: '#D97706', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Monthly Reports */}
        <TabsContent value="monthly" className="space-y-6 mt-6">
          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="monthly-summary-card">
            <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">Current Month Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold font-mono text-forest-500">{currentMonthPeople}</p>
                <p className="text-xs text-stone-600 uppercase">People Contacted</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-mango-500">₱{currentMonthExpenses.toFixed(0)}</p>
                <p className="text-xs text-stone-600 uppercase">Total Expenses</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-600">Budget Usage</span>
                <span className="font-mono font-bold text-stone-900">{budgetUsagePercent}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-3">
                <div 
                  className={`h-full rounded-full transition-all ${
                    budgetUsagePercent > 90 ? 'bg-red-500' : 
                    budgetUsagePercent > 75 ? 'bg-yellow-500' : 
                    'bg-forest-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="monthly-people-chart">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">People Contacted (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: '8px' }}
                  labelStyle={{ color: '#1C1917', fontWeight: 'bold' }}
                />
                <Bar dataKey="people" fill="#0F5132" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="monthly-expenses-chart">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">Monthly Expenses (PHP)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: '8px' }}
                  labelStyle={{ color: '#1C1917', fontWeight: 'bold' }}
                />
                <Bar dataKey="expenses" fill="#D97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-6" data-testid="monthly-completion-chart">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4">Days with Journal Entries</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: '8px' }}
                  labelStyle={{ color: '#1C1917', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="daysCompleted" stroke="#0F5132" strokeWidth={3} dot={{ fill: '#0F5132', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Accountability Note */}
      <Card className="bg-forest-50 rounded-xl border border-forest-100 p-6" data-testid="accountability-note">
        <h3 className="font-serif text-lg font-semibold text-forest-900 mb-2">Accountability & Transparency</h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          "Numbers are not the gospel — but they are the fingerprints of faithfulness. Recording who you reached, 
          who said yes, and every peso spent is an act of worship. Five years from now, this record will become 
          one of the greatest testimonies of your church's founding story."
        </p>
      </Card>
    </div>
  );
};

export default Reports;