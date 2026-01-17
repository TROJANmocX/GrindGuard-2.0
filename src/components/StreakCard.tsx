interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  todayStatus: 'present' | 'absent';
}

export function StreakCard({ currentStreak, longestStreak, todayStatus }: StreakCardProps) {
  const isPresent = todayStatus === 'present';

  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <h1 className="text-9xl font-light text-white tracking-tighter leading-none mb-2">
        {currentStreak}
      </h1>
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-gray-500 mb-6">
        Day Streak
      </p>

      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 mb-6 px-3 py-1 bg-green-950/30 border border-green-900/50 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
            Verified LeetCode Sync
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full">
        <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-500' : 'bg-gray-600'}`} />
        <span className="text-xs font-medium text-gray-300">
          {isPresent ? 'Active' : 'Not logged today'}
        </span>
      </div>
    </div>
  );
}
