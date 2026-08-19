import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResetPassword } from '@/sections/ResetPassword';

export function Auth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      'Password reset email sent! Check your inbox.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage(
        'Account created! Check your email to confirm your account.'
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">
          Loading StudyMind...
        </div>
      </div>
    );
  }

  if (isRecoveringPassword) {
    return <ResetPassword />;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              StudyMind
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Your personal AI study assistant
            </p>
          </div>

          {forgotPassword ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Reset your password
              </h2>

              <p className="text-sm text-gray-500 mb-5">
                Enter your email and we'll send you a password reset link.
              </p>

              <form
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
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
                  className="w-full rounded-xl bg-brand-500 text-white py-3 font-semibold hover:opacity-90"
                >
                  Send Reset Email
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setError('');
                  setMessage('');
                }}
                className="w-full mt-4 text-sm text-brand-600 hover:underline"
              >
                Back to Log In
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>

              <p className="text-sm text-gray-500 mb-5">
                {isSignUp
                  ? 'Create an account to save your study progress.'
                  : 'Log in to continue studying.'}
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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
                  className="w-full rounded-xl bg-brand-500 text-white py-3 font-semibold hover:opacity-90"
                >
                  {isSignUp ? 'Create Account' : 'Log In'}
                </button>
              </form>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
                    setError('');
                    setMessage('');
                  }}
                  className="w-full mt-4 text-sm text-brand-600 hover:underline"
                >
                  Forgot your password?
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v);
                  setError('');
                  setMessage('');
                }}
                className="w-full mt-3 text-sm text-brand-600 hover:underline"
              >
                {isSignUp
                  ? 'Already have an account? Log in'
                  : "Don't have an account? Sign up"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}