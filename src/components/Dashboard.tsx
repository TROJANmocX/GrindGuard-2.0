import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { StreakCard } from './StreakCard';
import { DailyMission } from './DailyMission';
import { ProblemList } from './ProblemList';
import { Settings } from './Settings';
import { Analytics } from './Analytics';
import { fetchLeetCodeStats, fetchSolvedProblems, LeetCodeStats, SolvedProblem } from '../lib/leetcode';
import { parseStriverSheet } from '../lib/csvParser';
import { loadLeetCodeMetadata, enrichProblems, EnrichedProblem } from '../lib/enrichment';
import { calculateProgress } from '../lib/progress';
import { getManualSolved, toggleManualSolved } from '../lib/storage';
import { extractSlugFromUrl } from '../utils/normalization';
import { calculateAttendance } from '../lib/attendance';
import { checkAndSendPressure } from '../lib/notifications';
import { getDailyMission } from '../lib/recommendation';
import { Trophy, Target, Award } from 'lucide-react';
import { AppError, ErrorType, createError, fetchWithRetry } from '../utils/errors';

type View = 'dashboard' | 'focus' | 'progress' | 'analytics' | 'settings';

export function Dashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Source Data State
  const [striverProblems, setStriverProblems] = useState<EnrichedProblem[]>([]);
  const [autoSolvedList, setAutoSolvedList] = useState<SolvedProblem[]>([]);
  const [manualSolvedSlugs, setManualSolvedSlugs] = useState<string[]>([]);
  const [profileStats, setProfileStats] = useState<LeetCodeStats | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<AppError | null>(null);

  // 1. Derived: Merged Solved List
  const allSolved = useMemo(() => {
    const combined: SolvedProblem[] = [...autoSolvedList];
    manualSolvedSlugs.forEach(slug => {
      // Avoid duplicates if already in auto (though manual usually tracks what auto misses or local overrides)
      // Our logic: manual is additive or override?
      // Current logic: If manual slug not in auto, add it.
      if (!combined.find(p => p.problemSlug === slug)) {
        combined.push({
          problemSlug: slug,
          problemTitle: slug,
          language: 'manual',
          timestamp: new Date().toISOString()
        });
      }
    });
    return combined;
  }, [autoSolvedList, manualSolvedSlugs]);

  // 2. Derived: Stats & Mission
  const allSolvedSlugs = useMemo(() => allSolved.map(p => p.problemSlug), [allSolved]);

  // Calculated whenever allSolved or striverProblems changes
  const progressStats = useMemo(() => {
    if (striverProblems.length === 0) return null;
    const { stats } = calculateProgress(striverProblems, allSolved);
    return stats;
  }, [striverProblems, allSolved]);

  const attendanceStats = useMemo(() => {
    // If we don't have profileStats, we can't fully calc streaks from calendar, 
    // but we can try with just solved history if needed.
    // calculateAttendance handles missing calendar gracefully-ish?
    return calculateAttendance(allSolved, profileStats?.submissionCalendar);
  }, [allSolved, profileStats]);

  const dailyMission = useMemo(() => {
    if (striverProblems.length === 0) return null;
    return getDailyMission(striverProblems, allSolved);
  }, [striverProblems, allSolved]);


  const refreshData = useCallback(async () => {
    if (!profile?.username) return;
    if (profile.username === 'TestUser') return;

    setIsSyncing(true);
    setSyncError(null); // Clear previous errors

    try {
      const username = profile.username;

      // 1. Fetch Everything with retry
      const [lcStats, leetcodeSolved, striverSheet, metadata] = await Promise.all([
        fetchWithRetry(() => fetchLeetCodeStats(username)),
        fetchWithRetry(() => fetchSolvedProblems(username)),
        parseStriverSheet(),
        loadLeetCodeMetadata()
      ]);

      const enrichedSheet = enrichProblems(striverSheet, metadata);

      const manualSolved = getManualSolved();

      // 4. Set Source State (Derived states will auto-update)
      setStriverProblems(enrichedSheet);
      setAutoSolvedList(leetcodeSolved);
      setManualSolvedSlugs(manualSolved);
      setProfileStats(lcStats);

      setLastSyncedAt(new Date());

    } catch (e: any) {
      console.error("Dashboard Sync Error:", e);

      // Create detailed error
      const error = createError(
        e.message?.includes('network') ? ErrorType.NETWORK_ERROR :
          e.message?.includes('auth') ? ErrorType.AUTH_ERROR :
            ErrorType.API_FAILURE,
        e.message || "Sync failed",
        "Check your LeetCode username and internet connection.",
        true // retryable
      );

      setSyncError(error);
      // IMPORTANT: We do NOT clear the data. Old data is better than no data.
    } finally {
      setIsSyncing(false);
    }
  }, [profile]);

  // Side Effect: Pressure Notification
  useEffect(() => {
    if (attendanceStats && !isSyncing) {
      checkAndSendPressure(attendanceStats.todayStatus);
    }
  }, [attendanceStats, isSyncing]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleManualToggle = (url: string) => {
    const slug = extractSlugFromUrl(url);
    const newManual = toggleManualSolved(slug);
    setManualSolvedSlugs(newManual);
    // Derived state 'allSolved' -> 'dailyMission' will update automatically
  };



  if (!profile) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gray-800">
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as View)}
        onSync={refreshData}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
      />

      <main className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="flex flex-col items-center justify-center space-y-8 md:space-y-12 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-light tracking-tight text-white">Welcome, {profile.username}.</h2>
              <p className="text-gray-500">Here is your status for today.</p>
            </div>

            <StreakCard
              currentStreak={attendanceStats?.currentStreak ?? 0}
              longestStreak={attendanceStats?.longestStreak ?? 0}
              todayStatus={attendanceStats?.todayStatus ?? 'absent'}
            />

            {/* NEW: Profile Stats Section */}
            {profileStats && (
              <div className="max-w-2xl w-full grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-2"><Trophy className="w-5 h-5 text-yellow-500" /></div>
                  <div className="text-2xl font-bold text-white">{profileStats.totalSolved}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Solved</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-2"><Target className="w-5 h-5 text-blue-500" /></div>
                  <div className="text-2xl font-bold text-white">{profileStats.ranking}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Global Rank</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-2"><Award className="w-5 h-5 text-purple-500" /></div>
                  <div className="text-2xl font-bold text-white">{profileStats.reputation}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Reputation</div>
                </div>
              </div>
            )}

            <p className="text-gray-600 font-medium italic">"Consistency is the only currency that matters."</p>
          </div>
        )}

        {/* VIEW 2: DAILY FOCUS */}
        {currentView === 'focus' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8 border-b border-gray-900 pb-4">
              <h2 className="text-2xl font-light text-white">Today's Focus</h2>
              <p className="text-gray-500 mt-1">Complete these tasks to maintain your streak.</p>
            </div>
            <DailyMission
              mission={dailyMission}
              solvedSlugs={allSolvedSlugs}
              onToggle={handleManualToggle}
            />
          </div>
        )}

        {/* VIEW 3: PROGRESS */}
        {currentView === 'progress' && (
          <div className="animate-fade-in">
            <div className="mb-8 border-b border-gray-900 pb-4">
              <h2 className="text-2xl font-light text-white">Progress Tracker</h2>
              <p className="text-gray-500 mt-1">Striver's SDE Sheet</p>
            </div>
            <ProblemList
              problems={striverProblems}
              solvedSlugs={allSolvedSlugs}
              onToggle={handleManualToggle}
              dailyMission={dailyMission}
              progressStats={progressStats}
            />
          </div>
        )}

        {/* VIEW 4: ANALYTICS */}
        {currentView === 'analytics' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8 border-b border-gray-900 pb-4">
              <h2 className="text-2xl font-light text-white">Focus Map</h2>
              <p className="text-gray-500 mt-1">Visualize your topic mastery.</p>
            </div>
            <Analytics
              profileStats={profileStats}
              problems={striverProblems}
              solvedSlugs={allSolvedSlugs}
            />
          </div>
        )}

        {/* VIEW 5: SETTINGS */}
        {currentView === 'settings' && <Settings />}
      </main>
    </div>
  );
}
