import { LeetCodeStats } from '../lib/leetcode';
import { Crown, Shield, Sword, User } from 'lucide-react';

interface BenchmarkingProps {
    stats: LeetCodeStats | null;
}

export function Benchmarking({ stats }: BenchmarkingProps) {
    if (!stats) return null;

    // Define Tiers
    // Logic: Based on total solved and hard count
    const tiers = [
        { name: 'Novice', min: 0, color: 'text-zinc-400', icon: User },
        { name: 'Guardian', min: 100, color: 'text-green-400', icon: Shield },
        { name: 'Knight', min: 300, color: 'text-blue-400', icon: Sword },
        { name: 'Legend', min: 600, color: 'text-yellow-400', icon: Crown },
    ];

    const currentTier = tiers.slice().reverse().find(t => stats.totalSolved >= t.min) || tiers[0];
    const nextTier = tiers[tiers.findIndex(t => t.name === currentTier.name) + 1];

    // Percentile Calc (Simplified Estimate)
    // Assuming typical distribution: 
    // < 50: Top 80%
    // 50-200: Top 50%
    // 200-500: Top 15%
    // 500-1000: Top 5%
    // > 1000: Top 1%
    let percentile = 0;
    if (stats.totalSolved < 50) percentile = 80;
    else if (stats.totalSolved < 200) percentile = 50;
    else if (stats.totalSolved < 500) percentile = 20; // top 20%
    else if (stats.totalSolved < 1000) percentile = 5;
    else percentile = 1;

    // Rank Progress
    const progress = nextTier
        ? ((stats.totalSolved - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        : 100;

    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm animate-fade-in">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium text-white mb-1">Global Standing</h3>
                    <p className="text-zinc-500 text-sm">Where you stand among developers</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border bg-black/40 ${currentTier.color.replace('text-', 'border-').replace('400', '900')}`}>
                    <currentTier.icon className={`w-4 h-4 ${currentTier.color}`} />
                    <span className={`text-sm font-bold uppercase tracking-wider ${currentTier.color}`}>
                        {currentTier.name}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {/* Ranking Badge */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-zinc-800/50 border-4 border-zinc-800 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">Top {percentile}%</span>
                        </div>
                        {percentile <= 20 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ELITE
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.ranking.toLocaleString()}</div>
                        <p className="text-zinc-500 text-sm">Global Rank</p>
                    </div>
                </div>

                {/* Tier Progress */}
                {nextTier && (
                    <div className="bg-black/40 rounded-lg p-4 border border-zinc-800">
                        <div className="flex justify-between text-xs text-zinc-400 mb-2">
                            <span>{stats.totalSolved} Solved</span>
                            <span>Next: {nextTier.name} ({nextTier.min})</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${currentTier.color.replace('text-', 'bg-')}`}
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 text-center">
                            {nextTier.min - stats.totalSolved} problems to rank up
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
