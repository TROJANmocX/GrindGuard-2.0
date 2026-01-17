import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { StreakCard } from './StreakCard';
import { DailyMission } from './DailyMission';
import { ProgressBattlefield } from './ProgressBattlefield';
import { ProblemList } from './ProblemList';
import { Settings } from './Settings';
import { fetchLeetCodeStats, fetchSolvedProblems, LeetCodeStats, SolvedProblem } from '../lib/leetcode';
import { parseStriverSheet, StriverProblem } from '../lib/csvParser';
import { calculateProgress } from '../lib/progress';
import { getManualSolved, toggleManualSolved } from '../lib/storage';
import { extractSlugFromUrl } from '../utils/normalization';
import { calculateAttendance, AttendanceStats } from '../lib/attendance';
import { checkAndSendPressure } from '../lib/notifications';
import { getDailyMission, DailyMission as DailyMissionType } from '../lib/recommendation';
import { Trophy, Target, Award } from 'lucide-react';

type View = 'dashboard' | 'focus' | 'progress' | 'analytics' | 'settings';

export function Dashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Unified Data State
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [progressStats, setProgressStats] = useState<any | null>(null);
  const [autoSolvedList, setAutoSolvedList] = useState<SolvedProblem[]>([]);
  const [manualSolvedSlugs, setManualSolvedSlugs] = useState<string[]>([]);
  const [dailyMission, setDailyMission] = useState<DailyMissionType | null>(null);
  const [profileStats, setProfileStats] = useState<LeetCodeStats | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.username) return;

    try {
      const username = profile.username === 'TestUser' ? 'trojanmocx' : profile.username;

      // 1. Fetch Everything
      const [lcStats, leetcodeSolved, striverSheet] = await Promise.all([
        fetchLeetCodeStats(username),
        fetchSolvedProblems(username),
        parseStriverSheet()
      ]);

      const manualSolved = getManualSolved();

      // 2. Merge Solved
      const allSolved = [...leetcodeSolved];
      manualSolved.forEach(slug => {
        if (!allSolved.find(p => p.problemSlug === slug)) {
          allSolved.push({ problemSlug: slug, problemTitle: slug, language: 'manual', timestamp: new Date().toISOString() });
        }
      });

      // 3. Calculate Stats
      const { stats } = calculateProgress(striverSheet, allSolved);
      const attStats = calculateAttendance(allSolved, lcStats?.submissionCalendar);
      const mission = getDailyMission(striverSheet, allSolved);

      // 4. Set State
      setAutoSolvedList(leetcodeSolved);
      setManualSolvedSlugs(manualSolved);
      setProgressStats(stats);
      setAttendanceStats(attStats);
      setDailyMission(mission);
      setProfileStats(lcStats);

      // Pressure check
      checkAndSendPressure(attStats.todayStatus);

    } catch (e) {
      console.error("Dashboard Load Error:", e);
    }
  };

  const handleManualToggle = (url: string) => {
    const slug = extractSlugFromUrl(url);
    const newManual = toggleManualSolved(slug);
    setManualSolvedSlugs(newManual);
    // Optimistic: Add to mission state locally if part of mission?
    // For now simple reload logic or local check toggles
  };

  if (!profile) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gray-800">
      <Header currentView={currentView} onNavigate={(view) => setCurrentView(view as View)} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in">
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
              solvedSlugs={[...autoSolvedList.map(p => p.problemSlug), ...manualSolvedSlugs]}
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
            <ProblemList />
          </div>
        )}

        {/* VIEW 4: ANALYTICS */}
        {currentView === 'analytics' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8 border-b border-gray-900 pb-4">
              <h2 className="text-2xl font-light text-white">Focus Map</h2>
              <p className="text-gray-500 mt-1">Visualize your topic mastery.</p>
            </div>
            <ProgressBattlefield stats={progressStats} />
          </div>
        )}

        {/* VIEW 5: SETTINGS */}
        {currentView === 'settings' && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className="mb-8 border-b border-gray-900 pb-4">
              <h2 className="text-2xl font-light text-white">Settings</h2>
            </div>
            <Settings />
          </div>
        )}
      </main>
    </div>
  );
}
