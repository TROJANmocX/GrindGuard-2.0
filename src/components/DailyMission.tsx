import { CheckCircle2, Circle, Target, RefreshCw, Zap } from 'lucide-react';
import { DailyMission as DailyMissionType } from '../lib/recommendation';
import { extractSlugFromUrl } from '../utils/normalization';

interface DailyMissionProps {
    mission: DailyMissionType | null;
    solvedSlugs: string[];
    onToggle: (url: string) => void;
}

export function DailyMission({ mission, solvedSlugs, onToggle }: DailyMissionProps) {
    if (!mission) {
        return (
            <div className="py-12 text-center border border-dashed border-gray-800 rounded-lg">
                <p className="text-gray-500">All caught up! No active focus today.</p>
            </div>
        );
    }

    const allDone = mission.problems.every(p =>
        solvedSlugs.includes(extractSlugFromUrl(p.LeetCodeLink))
    );

    // Dynamic styles based on mission type
    const missionConfig = {
        WEAKNESS: { icon: Target, color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-900/50' },
        REVIEW: { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/50' },
        CHALLENGE: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-900/50' }
    };

    const config = missionConfig[mission.type] || missionConfig.WEAKNESS;
    const Icon = config.icon;

    return (
        <div className="space-y-4">
            <div className={`p-5 rounded-lg border flex items-start gap-4 ${allDone ? 'border-green-900 bg-green-950/20' : config.bg}`}>
                <div className={`p-2 rounded-lg bg-black/40 border border-white/5 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            {mission.title}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-black/30 ${config.color} uppercase tracking-wider`}>
                                {mission.type}
                            </span>
                        </h3>
                        {allDone && <span className="text-green-500 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Done</span>}
                    </div>
                    <p className="text-zinc-400 text-sm">{mission.description}</p>
                </div>
            </div>

            <div className="space-y-2">
                {mission.problems.map((prob, idx) => {
                    const slug = extractSlugFromUrl(prob.LeetCodeLink);
                    const isSolved = solvedSlugs.includes(slug);

                    return (
                        <div
                            key={idx}
                            className={`group flex items-center justify-between py-3 px-3 rounded-lg transition-all border ${isSolved ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onToggle(prob.LeetCodeLink)}
                                    className="focus:outline-none"
                                >
                                    {isSolved
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500 hover:text-green-400 transition-colors" />
                                        : <Circle className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                    }
                                </button>

                                <a
                                    href={prob.LeetCodeLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`font-medium transition-colors hover:underline ${isSolved
                                        ? 'text-zinc-600 line-through decoration-zinc-700'
                                        : 'text-zinc-200 hover:text-white hover:decoration-blue-500'
                                        }`}
                                >
                                    {prob.QuestionName}
                                </a>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${prob.Difficulty?.includes('Easy') ? 'text-green-400 border-green-900/30 bg-green-900/10' :
                                prob.Difficulty?.includes('Medium') ? 'text-yellow-400 border-yellow-900/30 bg-yellow-900/10' :
                                    'text-red-400 border-red-900/30 bg-red-900/10'
                                }`}>
                                {prob.Difficulty || 'Easy'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
