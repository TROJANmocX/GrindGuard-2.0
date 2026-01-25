import { EnrichedProblem } from '../lib/enrichment';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';

interface DataHealthProps {
    problems: EnrichedProblem[];
}

export function DataHealth({ problems }: DataHealthProps) {
    // Audit metrics
    const total = problems.length;

    // Problems with valid LeetCode URLs (not raw strings like "n/a" or just text)
    const validLinks = problems.filter(p =>
        p.LeetCodeLink &&
        p.LeetCodeLink.includes('leetcode.com/')
    ).length;

    // Problems with enriched metadata (acceptance rate > 0 means we found it in 50k dataset)
    const enrichedCount = problems.filter(p => (p.acceptanceRate ?? 0) > 0).length;

    // Problems marked as Premium
    const premiumCount = problems.filter(p => p.isPremium).length;

    const coveragePct = total > 0 ? (validLinks / total) * 100 : 0;
    const enrichmentPct = total > 0 ? (enrichedCount / total) * 100 : 0;

    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-zinc-400" />
                Data Health
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metric 1: Link Coverage */}
                <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-sm">Valid LC Links</span>
                        {coveragePct > 50 ?
                            <CheckCircle className="w-4 h-4 text-green-500" /> :
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        }
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {validLinks} <span className="text-zinc-600 text-lg">/ {total}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${coveragePct > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${coveragePct}%` }}
                        />
                    </div>
                </div>

                {/* Metric 2: Metadata Enrichment */}
                <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-zinc-500 text-sm">Enriched Metadata</span>
                        {enrichmentPct > 50 ?
                            <CheckCircle className="w-4 h-4 text-blue-500" /> :
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                        }
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {enrichedCount} <span className="text-zinc-600 text-lg">/ {total}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${enrichmentPct}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500">
                <p>
                    <strong>Premium Problems:</strong> {premiumCount} detected.
                    <br />
                    Data source: Striver SDE Sheet + 50k LeetCode Metadata (Fixed).
                </p>
            </div>
        </div>
    );
}
