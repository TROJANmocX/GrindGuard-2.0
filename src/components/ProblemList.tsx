import { useState, useEffect } from 'react';
import { extractSlugFromUrl } from '../utils/normalization';
import { EnrichedProblem } from '../lib/enrichment';
import { DailyMission } from '../lib/recommendation';
import {
  ExternalLink,
  CheckCircle,
  Search,
  Zap,
  Briefcase,
  Activity
} from 'lucide-react';

type FilterStatus = 'all' | 'todo' | 'solved';
type FilterDifficulty = 'all' | 'Easy' | 'Medium' | 'Hard';

interface ProblemListProps {
  problems: EnrichedProblem[];
  solvedSlugs: string[];
  onToggle: (url: string) => void;
  dailyMission: DailyMission | null;
  progressStats: any | null;
}

export function ProblemList({ problems, solvedSlugs, onToggle, dailyMission, progressStats }: ProblemListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');

  // Pagination State
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to check if problem is in mission
  const isMissionProblem = (link: string) => {
    if (!dailyMission) return false;
    const slug = extractSlugFromUrl(link);
    return dailyMission.problems.some(p => extractSlugFromUrl(p.LeetCodeLink) === slug);
  };

  // Helper to check if topic is weak (< 40% completion)
  const isWeakTopic = (topic: string) => {
    if (!progressStats || !progressStats.topicBreakdown) return false;
    const data = progressStats.topicBreakdown[topic];
    if (!data || data.total === 0) return false;
    return (data.completed / data.total) < 0.4;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDifficulty]);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.QuestionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Topic.toLowerCase().includes(searchQuery.toLowerCase());

    // Check if solved
    const slug = extractSlugFromUrl(p.LeetCodeLink);
    const isSolved = solvedSlugs.includes(slug);

    const matchesStatus = filterStatus === 'all' || (filterStatus === 'solved' ? isSolved : !isSolved);
    const matchesDifficulty = filterDifficulty === 'all' || p.Difficulty === filterDifficulty;

    return matchesSearch && matchesStatus && matchesDifficulty;
  }).sort((a, b) => {
    // Smart Sort:
    // 1. Mission Problems (Top Priority)
    // 2. Unsolved vs Solved (Unsolved higher)

    const slugA = extractSlugFromUrl(a.LeetCodeLink);
    const slugB = extractSlugFromUrl(b.LeetCodeLink);

    const isMissionA = isMissionProblem(a.LeetCodeLink);
    const isMissionB = isMissionProblem(b.LeetCodeLink);
    if (isMissionA && !isMissionB) return -1;
    if (!isMissionA && isMissionB) return 1;

    const isWeakA = isWeakTopic(a.Topic);
    const isWeakB = isWeakTopic(b.Topic);

    const isSolvedA = solvedSlugs.includes(slugA);
    const isSolvedB = solvedSlugs.includes(slugB);

    if (!isSolvedA && !isSolvedB) {
      if (isWeakA && !isWeakB) return -1;
      if (!isWeakA && isWeakB) return 1;
    }

    if (!isSolvedA && isSolvedB) return -1; // Unsolved first
    if (isSolvedA && !isSolvedB) return 1;

    return 0;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProblems = filteredProblems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all text-white placeholder-zinc-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-300"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="solved">Solved</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as FilterDifficulty)}
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-300"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-medium text-center w-16">Status</th>
                <th className="px-6 py-4 font-medium">Problem</th>
                <th className="px-6 py-4 font-medium w-32">Difficulty</th>
                <th className="px-6 py-4 font-medium w-32">Acceptance</th>
                <th className="px-6 py-4 font-medium text-right w-24">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {paginatedProblems.map((problem, idx) => {
                const slug = extractSlugFromUrl(problem.LeetCodeLink);
                const isSolved = solvedSlugs.includes(slug);
                const isMission = isMissionProblem(problem.LeetCodeLink);
                const difficultyColor =
                  problem.Difficulty === 'Easy' ? 'text-green-400 bg-green-400/10' :
                    problem.Difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-400/10' :
                      'text-red-400 bg-red-400/10';

                return (
                  <tr
                    key={`${slug}-${idx}`}
                    className={`group hover:bg-zinc-900/60 transition-colors ${isSolved ? 'bg-zinc-900/20 opacity-60 hover:opacity-100' : ''} ${isMission ? 'bg-blue-900/10 hover:bg-blue-900/20' : ''}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(problem.LeetCodeLink);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${isSolved
                          ? 'text-green-400 hover:bg-green-400/20'
                          : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400'
                          }`}
                      >
                        <CheckCircle className={`w-5 h-5 ${isSolved ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={problem.LeetCodeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-zinc-200 group-hover:text-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {problem.QuestionName}
                        </a>
                        {isMission && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Daily
                          </span>
                        )}
                        {problem.isPremium && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 rounded-full" title="Premium Problem">
                            Premium
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
                          {problem.Topic}
                        </span>
                        {problem.companies && problem.companies.length > 0 && (
                          <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1" title={problem.companies.join(', ')}>
                            <Briefcase className="w-3 h-3" />
                            {problem.companies[0]} {problem.companies.length > 1 && `+${problem.companies.length - 1}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${difficultyColor}`}>
                        {problem.Difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {problem.acceptanceRate ? (
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-zinc-600" />
                          <span className={`text-sm font-mono ${problem.acceptanceRate < 30 ? 'text-red-400' : problem.acceptanceRate > 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {problem.acceptanceRate.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={problem.LeetCodeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedProblems.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            <p>No problems found matching your criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterDifficulty('all'); }}
              className="mt-4 text-blue-400 hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredProblems.length > ITEMS_PER_PAGE && (
          <div className="px-6 py-4 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="text-sm text-zinc-500">
              Showing <span className="font-medium text-zinc-300">{startIndex + 1}</span> to <span className="font-medium text-zinc-300">{Math.min(startIndex + ITEMS_PER_PAGE, filteredProblems.length)}</span> of <span className="font-medium text-zinc-300">{filteredProblems.length}</span> problems
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors text-zinc-300"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-zinc-400 px-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors text-zinc-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
