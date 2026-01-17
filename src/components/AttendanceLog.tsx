import { AttendanceStats } from '../lib/attendance';

interface AttendanceLogProps {
    stats: AttendanceStats | null;
}

export function AttendanceLog({ stats }: AttendanceLogProps) {
    if (!stats) return null;

    // We want to show the last 14 days relative to TODAY
    const today = new Date();
    const daysToShow = 14;
    const historySet = new Set(stats.history);

    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    const todayStr = today.toISOString().split('T')[0];
    const isTodayChecked = historySet.has(todayStr);

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">History</h3>
                <span className="text-xs text-slate-500 font-medium">Last {daysToShow} Days</span>
            </div>

            <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                {days.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isPresent = historySet.has(dateStr);
                    const isToday = idx === daysToShow - 1;

                    return (
                        <div key={dateStr} className="flex flex-col items-center gap-2 min-w-[30px]">
                            <div className={`w-8 h-8 rounded-lg transition-all ${isPresent
                                ? 'bg-green-500/20 text-green-500' // Green square for present
                                : isToday
                                    ? 'bg-slate-800 border border-slate-700' // Empty box for today if pending
                                    : 'bg-slate-900 border border-slate-800' // Darker for past missed
                                }`}
                                title={dateStr}
                            />
                            <span className={`text-[10px] font-medium uppercase ${isToday ? 'text-white' : 'text-slate-600'
                                }`}>
                                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </span>
                        </div>
                    );
                })}
            </div>

            {!isTodayChecked && (
                <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between items-center">
                    <p className="text-slate-400 text-sm">
                        You haven't checked in today.
                    </p>
                    <span className="text-orange-500 text-xs font-medium">Pending</span>
                </div>
            )}
        </div>
    );
}
