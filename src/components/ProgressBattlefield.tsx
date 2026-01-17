import { ProgressStats } from '../lib/progress';

interface ProgressBattlefieldProps {
    stats: ProgressStats | null;
}

export function ProgressBattlefield({ stats }: ProgressBattlefieldProps) {
    if (!stats) return null;

    // Convert stats to array and sort by completion rate
    const topics = Object.entries(stats.topicBreakdown).map(([name, data]) => ({
        name,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0 ? (data.completed / data.total) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {topics.map((topic) => (
                    <div key={topic.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-baseline">
                            <span className="font-medium text-white text-sm">{topic.name}</span>
                            <span className="text-xs font-mono text-gray-500">
                                {topic.completed}/{topic.total}
                            </span>
                        </div>

                        <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max(topic.percentage, 0)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
