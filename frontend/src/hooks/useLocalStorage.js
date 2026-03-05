import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}

export function useJournalData() {
  const [dailyEntries, setDailyEntries]     = useLocalStorage('dailyEntries', {});
  const [peopleContacts, setPeopleContacts] = useLocalStorage('peopleContacts', []);
  const [expenses, setExpenses]             = useLocalStorage('expenses', []);
  const [weeklyReports, setWeeklyReports]   = useLocalStorage('weeklyReports', []);
  const [monthlyReports, setMonthlyReports] = useLocalStorage('monthlyReports', []);
  const [calendarEvents, setCalendarEvents] = useLocalStorage('calendarEvents', []);

  return {
    dailyEntries,    setDailyEntries,
    peopleContacts,  setPeopleContacts,
    expenses,        setExpenses,
    weeklyReports,   setWeeklyReports,
    monthlyReports,  setMonthlyReports,
    calendarEvents,  setCalendarEvents,
  };
}
