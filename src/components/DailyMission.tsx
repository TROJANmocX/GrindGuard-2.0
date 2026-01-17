import { CheckCircle2, Circle } from 'lucide-react';
import { StriverProblem } from '../lib/csvParser';
import { extractSlugFromUrl } from '../utils/normalization';

interface DailyMissionProps {
    mission: {
        topic: string;
        problems: StriverProblem[];
    } | null;
    solvedSlugs: string[];
    onToggle: (url: string) => void;
}

export function DailyMission({ mission, solvedSlugs, onToggle }: DailyMissionProps) {
    if (!mission) {
        return (
            <div className="py-12 text-center border border-dashed border-gray-800 rounded-lg">
                <p className="text-gray-500">No active focus today.</p>
            </div>
        );
    }

    const allDone = mission.problems.every(p =>
        solvedSlugs.includes(extractSlugFromUrl(p.LeetCodeLink))
    );

    return (
        <div className="space-y-4">
            <div className={`p-4 rounded-lg border flex items-center justify-between ${allDone ? 'border-green-900 bg-green-950/20' : 'border-gray-800 bg-black'}`}>
                <div>
                    <h3 className="text-white font-medium">{mission.topic}</h3>
                    <p className="text-gray-500 text-sm">Focus Block</p>
                </div>
                {allDone && <span className="text-green-500 text-sm font-medium">Completed</span>}
            </div>

            <div className="space-y-2">
                {mission.problems.map((prob, idx) => {
                    const slug = extractSlugFromUrl(prob.LeetCodeLink);
                    const isSolved = solvedSlugs.includes(slug);

                    return (
                        <div
                            key={idx}
                            className="group flex items-center justify-between py-3 px-2 hover:bg-zinc-900/50 rounded transition-colors"
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
                                            : 'text-zinc-300 hover:text-white hover:decoration-blue-500'
                                        }`}
                                >
                                    {prob.QuestionName}
                                </a>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded bg-black/40 border border-zinc-800 ${prob.Difficulty?.includes('Easy') ? 'text-green-400 border-green-900/30' :
                                    prob.Difficulty?.includes('Medium') ? 'text-yellow-400 border-yellow-900/30' :
                                        'text-red-400 border-red-900/30'
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
