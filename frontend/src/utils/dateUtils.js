import { format, startOfWeek, startOfMonth, differenceInWeeks, differenceInMonths } from 'date-fns';

export const formatDate = (date) => format(date, 'yyyy-MM-dd');
export const formatDisplayDate = (date) => format(date, 'MMMM dd, yyyy');
export const formatDayOfWeek = (date) => format(date, 'EEEE');

export const getWeekNumber = (date) => {
  const startDate = new Date(2026, 2, 1); // March 1, 2026
  return differenceInWeeks(date, startDate) + 1;
};

export const getMonthNumber = (date) => {
  const startDate = new Date(2026, 2, 1); // March 1, 2026
  return differenceInMonths(date, startDate) + 1;
};

export const DAILY_TASKS = [
  'Scripture (5P\'s done)',
  'Pray for Timothys',
  'Pray for city',
  'Post gospel content',
  'Message disciple',
  'Log in People Tracker',
  'Log in Budget Ledger'
];

export const GENERATIONS = [
  { value: 'Gen Z', label: 'Gen Z (1997-2005, 21-29)', years: '1997-2005' },
  { value: 'Millennials', label: 'Millennials (1981-1996, 30-45)', years: '1981-1996' },
  { value: 'Gen X', label: 'Gen X (1975-1980, 46-51)', years: '1975-1980' }
];

export const EXPENSE_CATEGORIES = [
  'Transport',
  'Food/Hospitality',
  'Materials',
  'Digital Ministry',
  'Venue',
  'Prayer/Fasting',
  'Contingency',
  'Savings',
  'Other'
];

export const MONTHLY_BUDGET_PHP = 11400;
export const MONTHLY_BUDGET_USD = 200;
export const USD_TO_PHP = 57;