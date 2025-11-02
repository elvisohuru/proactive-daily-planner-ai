import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAppStore } from '../store/useAppStore';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { theme } = useAppStore();

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        setError(error.message);
    } else {
        setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-200 mb-2">
          Proactive Planner
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          Sign in to access your plan
        </p>

        <form className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              className="w-full bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              className="w-full bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-calm-blue-600 hover:bg-calm-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;