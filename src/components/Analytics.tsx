import { useMemo } from 'react';
import { Benchmarking } from './Benchmarking';
import { LeetCodeStats } from '../lib/leetcode';
import { EnrichedProblem } from '../lib/enrichment';
import { extractSlugFromUrl } from '../utils/normalization';
import { Award, Flame, Target } from 'lucide-react';

interface AnalyticsProps {
    profileStats: LeetCodeStats | null;
    problems: EnrichedProblem[];
    solvedSlugs: string[];
}

export function Analytics({ profileStats, problems, solvedSlugs }: AnalyticsProps) {

    // 1. Topic Strength Radar Data
    const topicStats = useMemo(() => {
        const stats: Record<string, { total: number; solved: number; name: string }> = {};

        problems.forEach(p => {
            const topic = p.Topic;
            if (!stats[topic]) {
                stats[topic] = { total: 0, solved: 0, name: topic };
            }
            stats[topic].total++;
            if (solvedSlugs.includes(extractSlugFromUrl(p.LeetCodeLink))) {
                stats[topic].solved++;
            }
        });

        // Top 6 topics by count for the Radar Chart (to avoid clutter)
        return Object.values(stats)
            .sort((a, b) => b.total - a.total)
            .slice(0, 6)
            .map(t => ({
                ...t,
                rate: t.total > 0 ? t.solved / t.total : 0
            }));
    }, [problems, solvedSlugs]);

    // 2. Activity Heatmap Data
    const heatmapData = useMemo(() => {
        const data = [];
        const submissionMap = new Map<string, number>();

        // Parse LeetCode Data
        // format: { "1706659200": 3, "1706745600": 1 } (Unix Limit Timestamps)
        if (profileStats?.submissionCalendar) {
            Object.entries(profileStats.submissionCalendar).forEach(([ts, count]) => {
                const date = new Date(parseInt(ts) * 1000);
                const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                submissionMap.set(key, count);
            });
        }

        // Generate last 365 days (approx 52 weeks)
        // We want to start on a Sunday to align grid
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 364);

        // Adjust to previous Sunday for alignment
        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        const current = new Date(startDate);
        while (current <= endDate) {
            const key = current.toISOString().split('T')[0];
            data.push({
                date: new Date(current),
                count: submissionMap.get(key) || 0,
                level: 0
            });
            current.setDate(current.getDate() + 1);
        }

        // Calc levels for color intensity
        const max = Math.max(...data.map(d => d.count), 1);
        data.forEach(d => {
            if (d.count === 0) d.level = 0;
            else if (d.count <= max * 0.25) d.level = 1;
            else if (d.count <= max * 0.50) d.level = 2;
            else if (d.count <= max * 0.75) d.level = 3;
            else d.level = 4;
        });

        return data;
    }, [profileStats]);

    const getHeatmapColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-green-900/40';
            case 2: return 'bg-green-700/60';
            case 3: return 'bg-green-500/80';
            case 4: return 'bg-green-400';
            default: return 'bg-zinc-800/50';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Global Benchmarks (P4) */}
            <Benchmarking stats={profileStats} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic Radar */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-medium text-white">Topic Mastery</h3>
                    </div>

                    <div className="h-64 flex items-center justify-center">
                        {topicStats.length > 0 ? (
                            <div className="relative w-64 h-64">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {/* Background Hexagon */}
                                    <polygon points="50,10 85,27 85,73 50,90 15,73 15,27" className="fill-zinc-800/50 stroke-zinc-700" strokeWidth="0.5" />
                                    <polygon points="50,30 67,38 67,62 50,70 33,62 33,38" className="fill-none stroke-zinc-700/50" strokeWidth="0.5" />

                                    {/* Data Polygon */}
                                    <polygon
                                        points={topicStats.map((t, i) => {
                                            const angle = (Math.PI * 2 * i) / 6;
                                            const r = 40 * t.rate; // Radius scaled 0-40 (leaving 10px margin)
                                            const x = 50 + r * Math.cos(angle);
                                            const y = 50 + r * Math.sin(angle);
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        className="fill-blue-500/20 stroke-blue-500"
                                        strokeWidth="2"
                                    />
                                </svg>
                                {/* Labels */}
                                {topicStats.map((t, i) => {
                                    // Position labels manually for the 6 sectors
                                    const styleMap = [
                                        { top: '-10px', left: '50%', transform: 'translateX(-50%)' }, // Top
                                        { top: '25%', right: '-20px' }, // Top Right
                                        { bottom: '25%', right: '-20px' }, // Bottom Right
                                        { bottom: '-10px', left: '50%', transform: 'translateX(-50%)' }, // Bottom
                                        { bottom: '25%', left: '-20px' }, // Bottom Left
                                        { top: '25%', left: '-20px' },// Top Left
                                    ];
                                    return (
                                        <div key={t.name} className="absolute text-[10px] text-zinc-400 font-medium whitespace-nowrap" style={styleMap[i]}>
                                            {t.name}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-zinc-500 text-sm">Solve more problems to unlock radar</div>
                        )}
                    </div>
                </div>

                {/* Consistency Graph */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                            <Flame className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-medium text-white">Consistency</h3>
                    </div>

                    <div className="h-64 flex items-end gap-1 overflow-hidden">
                        {/* Last 30 days history bar chart */}
                        {heatmapData.slice(-30).map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div
                                    className={`w-full rounded-t transition-all duration-500 ${d.count > 0 ? 'bg-orange-500' : 'bg-zinc-800'}`}
                                    style={{ height: `${Math.max(10, d.count * 10)}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-center text-xs text-zinc-500">Last 30 Days Activity</div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm overflow-x-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                        <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-white">Yearly Activity</h3>
                        <p className="text-xs text-zinc-500">Total submissions in the last year</p>
                    </div>
                </div>

                <div className="flex gap-1 min-w-[800px]">
                    {Array.from({ length: 53 }).map((_, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1">
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const dayData = heatmapData[weekIndex * 7 + dayIndex];
                                if (!dayData) return null;
                                return (
                                    <div
                                        key={dayIndex}
                                        className={`w-3 h-3 rounded-sm ${getHeatmapColor(dayData.level)}`}
                                        title={`${dayData.count} submissions on ${dayData.date.toDateString()}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-zinc-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
                        <div className="w-3 h-3 rounded-sm bg-green-900/40" />
                        <div className="w-3 h-3 rounded-sm bg-green-700/60" />
                        <div className="w-3 h-3 rounded-sm bg-green-500/80" />
                        <div className="w-3 h-3 rounded-sm bg-green-400" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
