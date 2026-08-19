import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        if (event === 'PASSWORD_RECOVERY' && session) {
          setReady(true);
          setError('');
        }
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        setReady(true);
      } else {
        setError(
          'Your password reset link has expired or is no longer valid. Please request a new reset email.'
        );
      }

      return subscription;
    };

    let subscription: { unsubscribe: () => void } | undefined;

    handleAuthStateChange().then((sub) => {
      subscription = sub;
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    setLoading(false);
    setMessage('Password updated successfully!');

    setPassword('');
    setConfirmPassword('');

    setTimeout(async () => {
      await supabase.auth.signOut({ scope: 'local' });
      window.location.href = '/';
    }, 1000);
  };

  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">
          Checking reset link...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            StudyMind
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Create a new password
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />

          {error && (
            <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full rounded-xl bg-brand-500 text-white py-3 font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

        </form>
      </div>
    </div>
  );
}