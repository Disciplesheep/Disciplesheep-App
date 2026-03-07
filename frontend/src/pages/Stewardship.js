import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, FileText, TrendingUp, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useJournalData } from '@/hooks/useLocalStorage';
import { useDiscipleshipTracking } from '@/hooks/useDiscipleshipTracking';
import { format } from 'date-fns';
import { getCurrentMinistryYear, getYearTargets } from '@/data/dailyDevotionals';

/* ── Pure helper — defined outside component, never re-created ───────────── */
const progressColor = (pct) => {
  if (pct <= 100) {
    const hue = Math.round((pct / 100) * 120);
    return `hsl(${hue}, 72%, 42%)`;
  }
  const over = Math.min(pct - 100, 50);
  return `hsl(${Math.round(120 - (over / 50) * 75)}, 80%, 42%)`;
};

/* ── Static menu config — outside component, zero allocation per render ──── */
const MENU_CONFIG = [
  {
    title: 'People Tracker',
    description: 'Log and track outreach contacts',
    icon: Users,
    path: '/stewardship/people',
    statKey: 'people',
    statLabel: 'this month',
    bgColor: 'bg-forest-50 dark:bg-forest-900/20',
    iconColor: 'text-forest-500 dark:text-forest-400',
    testId: 'people-tracker-card',
  },
  {
    title: 'Budget Ledger',
    description: 'Track expenses and budget',
    icon: Wallet,
    path: '/stewardship/expenses',
    statKey: 'expenses',
    statLabel: 'spent',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-mango-500 dark:text-mango-400',
    testId: 'budget-ledger-card',
  },
  {
    title: 'Reports',
    description: 'Weekly and monthly analytics',
    icon: FileText,
    path: '/stewardship/reports',
    statKey: null,
    stat: 'Track',
    statLabel: 'progress',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
    testId: 'reports-card',
  },
];

/* ── Progress bar row — extracted to avoid repeated inline JSX ───────────── */
const ProgressRow = ({ label, value, target, progress, note }) => (
  <div>
    <div className="flex justify-between text-sm mb-1.5">
      <span className="text-stone-700 dark:text-gray-100 font-medium">{label}</span>
      <span className="font-mono font-bold text-stone-900 dark:text-yellow-50">{value} / {target}</span>
    </div>
    <div className="w-full bg-white/60 dark:bg-stone-600 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full transition-all"
        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor(progress) }}
      />
    </div>
    <p className="text-sm text-stone-500 dark:text-gray-300 mt-1">{note}</p>
  </div>
);

/* ── Menu card — extracted to avoid re-declaring inside map ──────────────── */
const MenuCard = ({ item, stat, onNavigate }) => (
  <Card
    onClick={onNavigate}
    className={`${item.bgColor} rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] p-4 flex flex-col`}
    data-testid={item.testId}
  >
    <div className="flex flex-col items-start gap-3">
      <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
      </div>
      <div>
        <h3 className="font-serif text-sm font-semibold text-stone-900 dark:text-stone-100 mb-0.5">{item.title}</h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">{item.description}</p>
        <p className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100 leading-tight">{stat}</p>
        <p className="text-xs text-stone-500 uppercase tracking-wide mt-0.5">{item.statLabel}</p>
      </div>
    </div>
  </Card>
);

/* ── Stewardship ─────────────────────────────────────────────────────────── */
const Stewardship = () => {
  const navigate = useNavigate();
  const { peopleContacts, expenses } = useJournalData();
  const { disciples } = useDiscipleshipTracking();

  /* All derived values in one useMemo — single computation block per render */
  const stats = useMemo(() => {
    const currentMonth   = format(new Date(), 'yyyy-MM');
    const monthPeople    = peopleContacts.filter(p => p.date?.startsWith(currentMonth)).length;
    const monthExpenses  = expenses
      .filter(e => e.date?.startsWith(currentMonth))
      .reduce((sum, e) => sum + parseFloat(e.php || 0), 0);
    const currentYear    = getCurrentMinistryYear(new Date());
    const yearTargets    = getYearTargets(currentYear);

    return {
      currentMonth,
      monthPeople,
      monthExpenses,
      currentYear,
      yearTargets,
      peopleProgress:   Math.round((monthPeople   / yearTargets.monthly.peopleContacted) * 100),
      budgetProgress:   Math.round((monthExpenses  / yearTargets.monthly.budgetLimit)    * 100),
      discipleProgress: yearTargets.yearly.disciples
        ? Math.round((disciples.length / yearTargets.yearly.disciples) * 100)
        : 0,
    };
  }, [peopleContacts, expenses, disciples]);

  const { monthPeople, monthExpenses, currentYear, yearTargets,
          peopleProgress, budgetProgress, discipleProgress } = stats;

  /* Stat strings resolved from computed values — not rebuilt on every render
     unless the underlying data changes (same useMemo cycle as stats) */
  const menuStats = useMemo(() => ({
    people:   String(monthPeople),
    expenses: `₱${monthExpenses.toFixed(0)}`,
  }), [monthPeople, monthExpenses]);

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 81, 50, 0.9), rgba(15, 81, 50, 0.7)), url(https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="stewardship-header"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold tracking-tight">Stewardship</h1>
          </div>
          <p className="text-white/90 text-lg font-medium mb-1">Manage Your Ministry Resources</p>
          <p className="text-white/70 text-sm mb-4">People, Budget, and Progress Tracking</p>
          <div className="border-t border-white/20 pt-4">
            <p className="font-serif text-sm text-white/90 italic leading-relaxed">
              "Give an account of your management, for you can no longer be manager."
            </p>
            <p className="text-xs text-white/60 mt-1">— Luke 16:2 (NASB)</p>
          </div>
        </div>
      </div>

      {/* ── Goals & Progress ── */}
      <Card className="bg-gradient-to-br from-mango-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 rounded-xl shadow-sm border border-mango-100 dark:border-stone-600 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-mango-700 dark:text-yellow-400" />
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-yellow-50">
            Year {currentYear}: {yearTargets.phase}
          </h2>
        </div>
        <p className="text-sm text-stone-600 dark:text-yellow-100 mb-4 italic">"{yearTargets.motto}"</p>

        <div className="space-y-4">
          <ProgressRow
            label="People (Monthly)"
            value={monthPeople}
            target={yearTargets.monthly.peopleContacted}
            progress={peopleProgress}
            note={`${peopleProgress}% of monthly target`}
          />
          <ProgressRow
            label="Disciples (Yearly)"
            value={disciples.length}
            target={yearTargets.yearly.disciples}
            progress={discipleProgress}
            note={`${discipleProgress}% of year ${currentYear} target`}
          />
          <ProgressRow
            label="Budget (Monthly)"
            value={`₱${monthExpenses.toFixed(0)}`}
            target={`₱${yearTargets.monthly.budgetLimit}`}
            progress={budgetProgress}
            note={`${budgetProgress}% · ₱${(yearTargets.monthly.budgetLimit - monthExpenses).toFixed(0)} left`}
          />

          <div className="pt-3 border-t border-mango-200 dark:border-stone-500">
            <p className="text-sm text-stone-700 dark:text-gray-100">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
              <strong className="text-stone-900 dark:text-yellow-50">Year {currentYear} Goal:</strong>{' '}
              {yearTargets.yearly.attendanceGoal} attendance, {yearTargets.yearly.totalPeopleReached} total reached
            </p>
          </div>
        </div>
      </Card>

      {/* ── Menu Cards ── */}
      <div className="grid gap-4 grid-cols-3">
        {MENU_CONFIG.map((item) => (
          <MenuCard
            key={item.path}
            item={item}
            stat={item.statKey ? menuStats[item.statKey] : item.stat}
            onNavigate={() => navigate(item.path)}
          />
        ))}
      </div>

    </div>
  );
};

export default Stewardship;