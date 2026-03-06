import { useState, useCallback } from 'react';

const PASSWORD_KEY = 'disciplesheep_delete_password';

/**
 * useProfilePassword — manages the delete-guard password in localStorage.
 * Place at: src/hooks/useProfilePassword.js
 */
export function useProfilePassword() {
  const [, forceUpdate] = useState(0);

  const hasPassword = Boolean(localStorage.getItem(PASSWORD_KEY));

  const setPassword = useCallback((newPassword) => {
    if (!newPassword || newPassword.trim() === '') return false;
    localStorage.setItem(PASSWORD_KEY, newPassword.trim());
    forceUpdate(n => n + 1);
    return true;
  }, []);

  const verifyPassword = useCallback((input) => {
    const stored = localStorage.getItem(PASSWORD_KEY);
    if (!stored) return true;
    return input === stored;
  }, []);

  const removePassword = useCallback(() => {
    localStorage.removeItem(PASSWORD_KEY);
    forceUpdate(n => n + 1);
  }, []);

  return { hasPassword, setPassword, verifyPassword, removePassword };
}