import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { parseStriverSheet } from '../lib/csvParser';
import { analyzeProfileWithGemini } from '../lib/gemini';
import { fetchSolvedProblems } from '../lib/leetcode';

// Simple types for the API response
interface LeetCodeSubmission {
  titleSlug: string;
  title: string;
}

export function Auth() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const { signIn } = useAuth(); // We'll hijack signIn to just set the user in context/localstorage

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setStatus('Verifying credentials...');

    try {
      // 1. Lightweight Verification
      const cleanUsername = username.replace('https://leetcode.com/u/', '').replace('/', '');

      // Use fetchLeetCodeStats (fast /userProfile endpoint) just to check existence
      // dynamically import to avoid circular dep if any, or just rely on import
      // reusing the robust fetch from lib
      const stats = await import('../lib/leetcode').then(m => m.fetchLeetCodeStats(cleanUsername));

      if (!stats) {
        setStatus('User not found or API busy. Please check username.');
        setLoading(false);
        return;
      }

      setStatus('Verified. Logging in...');

      // 2. Save Session
      localStorage.setItem('grindguard_user', JSON.stringify({ username: cleanUsername }));

      // Note: We defer the heavy "fetchSolvedProblems" and "AI Analysis" to the Dashboard 
      // to ensure immediate access for the user.

      // 3. Enter App
      signIn(cleanUsername, 'placeholder');

    } catch (err) {
      console.error(err);
      setStatus('Login failed. try again.');
    } finally {
      // setLoading(false); // signIn usually unmounts/redirects, but safety first
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4 border border-gray-800">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight">
            GrindGuard
          </h1>
          <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">
            Ruthless Accountability
          </p>
        </div>

        {/* Card */}
        <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-gray-900/20">
          <form onSubmit={handleSync} className="space-y-6">

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                LeetCode Profile URL
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono text-sm group-hover:bg-gray-900"
                  placeholder="leetcode.com/u/your_username"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{status || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <span>Sync Profile</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* AI Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mt-6">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Gemini 1.5 Flash</span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
