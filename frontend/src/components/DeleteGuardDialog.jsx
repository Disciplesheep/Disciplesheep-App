import React, { useState, useEffect } from 'react';
import { Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useProfilePassword } from '@/hooks/useProfilePassword';

/**
 * DeleteGuardDialog — password-protected delete confirmation.
 * Place at: src/components/DeleteGuardDialog.jsx
 *
 * Props:
 *   open      {boolean}   controls visibility
 *   onClose   {function}  called on cancel
 *   onConfirm {function}  called only after correct password (or no password set)
 *   label     {string}    what is being deleted, e.g. "this expense"
 */
const DeleteGuardDialog = ({ open, onClose, onConfirm, label = 'this record' }) => {
  const { hasPassword, verifyPassword } = useProfilePassword();
  const [input, setInput]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (open) { setInput(''); setError(''); setShowPw(false); }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (hasPassword && !verifyPassword(input)) {
      setError('Incorrect password. Please try again.');
      setInput('');
      return;
    }
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl shadow-2xl p-6 space-y-5">

        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg">
            Delete {label}?
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {hasPassword ? 'Enter your password to confirm.' : 'This action cannot be undone.'}
          </p>
        </div>

        {hasPassword && (
          <div className="space-y-1.5">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={input}
                onChange={e => { setInput(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                placeholder="Password"
                autoFocus
                className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm
                  bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100
                  outline-none transition-colors
                  ${error
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-stone-200 dark:border-stone-600 focus:border-forest-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 shrink-0" /> {error}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-stone-200 dark:border-stone-600
              text-stone-700 dark:text-stone-300 text-sm font-medium
              hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600
              text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGuardDialog;