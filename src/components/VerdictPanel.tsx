import { ProgressStats } from '../lib/progress';
import { Target, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';

interface VerdictPanelProps {
    stats: ProgressStats | null;
}

export function VerdictPanel({ stats }: VerdictPanelProps) {
    if (!stats) return null;

    const percentage = stats.completionPercentage;

    let verdict = "Unknown";
    let description = "Start solving to track progress.";
    let color = "text-slate-500";
    let icon = <BarChart3 className="w-5 h-5" />;

    if (percentage === 0) {
        verdict = "Not Started";
        description = "No data points yet. Begin with the easier topics.";
        color = "text-slate-400";
    } else if (percentage < 30) {
        verdict = "Needs Work";
        description = "Consistency is low. Increase your daily volume.";
        color = "text-orange-500";
        icon = <AlertTriangle className="w-5 h-5" />;
    } else if (percentage < 70) {
        verdict = "Progressing";
        description = "Solid foundation. Focus on harder patterns.";
        color = "text-yellow-500";
        icon = <Target className="w-5 h-5" />;
    } else {
        verdict = "Strong";
        description = "Excellent command of topics. Maintain this level.";
        color = "text-green-500";
        icon = <CheckCircle2 className="w-5 h-5" />;
    }

    return (
        <div className="h-full flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight mb-1">Status Report</h2>
                    <p className={`text-sm font-medium ${color} flex items-center gap-2`}>
                        {icon}
                        {verdict}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-white tabular-nums">{percentage}%</p>
                    <p className="text-xs text-slate-500 font-medium">Completion</p>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-900">
                <p className="text-slate-400 text-sm leading-relaxed">
                    {description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span>{stats.completedProblems} Problems Solved</span>
                </div>
            </div>
        </div>
    );
}
