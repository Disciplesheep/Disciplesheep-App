import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, FileText, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useJournalData } from '@/hooks/useLocalStorage';
import { format } from 'date-fns';
import { useScreenSize } from '@/hooks/useScreenSize';

const Stewardship = () => {
  const navigate = useNavigate();
  const { isTablet } = useScreenSize();
  const { peopleContacts, expenses } = useJournalData();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthPeople = peopleContacts.filter(p => p.date?.startsWith(currentMonth)).length;
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);

  const menuItems = [
    {
      title: 'People Tracker',
      description: 'Log and track outreach contacts',
      icon: Users,
      path: '/stewardship/people',
      color: 'forest',
      stat: `${monthPeople} this month`,
      bgColor: 'bg-forest-50 dark:bg-forest-900/20',
      iconColor: 'text-forest-500 dark:text-forest-400',
      testId: 'people-tracker-card'
    },
    {
      title: 'Budget Ledger',
      description: 'Track expenses and budget',
      icon: Wallet,
      path: '/stewardship/expenses',
      color: 'mango',
      stat: `₱${monthExpenses.toFixed(0)} spent`,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-mango-500 dark:text-mango-400',
      testId: 'budget-ledger-card'
    },
    {
      title: 'Reports',
      description: 'Weekly and monthly analytics',
      icon: FileText,
      path: '/stewardship/reports',
      color: 'blue',
      stat: 'Track progress',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
      testId: 'reports-card'
    }
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 81, 50, 0.9), rgba(15, 81, 50, 0.7)), url(https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        data-testid="stewardship-header"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold tracking-tight">Stewardship</h1>
          </div>
          <p className="text-white/90 text-lg font-medium mb-1">Manage Your Ministry Resources</p>
          <p className="text-white/70 text-sm">People, Budget, and Progress Tracking</p>
        </div>
      </div>

      {/* Menu Cards */}
      <div className={`grid gap-4 ${isTablet ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {menuItems.map((item) => (
          <Card
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`${item.bgColor} rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] ${isTablet ? 'p-6 flex flex-col' : 'p-6'}`}
            data-testid={item.testId}
          >
            {isTablet ? (
              <div className="flex flex-col items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{item.description}</p>
                  <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{item.stat}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mt-1">Current</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{item.stat}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-500 uppercase tracking-wide">Current</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Accountability Quote */}
      <Card className="bg-forest-50 dark:bg-stone-800 rounded-xl border border-forest-100 dark:border-stone-700 p-6">
        <p className="font-serif text-base text-forest-900 dark:text-stone-100 italic text-center leading-relaxed">
          "Give an account of your management, for you can no longer be manager."
        </p>
        <p className="text-center text-sm text-stone-600 dark:text-stone-300 mt-2">— Luke 16:2 (NASB)</p>
      </Card>
    </div>
  );
};

export default Stewardship;
