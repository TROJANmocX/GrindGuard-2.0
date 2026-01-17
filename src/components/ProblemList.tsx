import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractSlugFromUrl } from '../utils/normalization';
import { parseStriverSheet, StriverProblem } from '../lib/csvParser';
import {
  Plus,
  ExternalLink,
  CheckCircle,
  Circle,
  Search,
} from 'lucide-react';

type FilterStatus = 'all' | 'todo' | 'solved';
type FilterDifficulty = 'all' | 'Easy' | 'Medium' | 'Hard';

export function ProblemList({ onAddClick }: { onAddClick: () => void }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState<StriverProblem[]>([]);
  const [solvedSlugs, setSolvedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [selectedProblem, setSelectedProblem] = useState<StriverProblem | null>(null);

  useEffect(() => {
    loadLocalData();
  }, [user]);

  async function loadLocalData() {
    try {
      const sheet = await parseStriverSheet();
      setProblems(sheet);

      const storedSolved = localStorage.getItem('grindguard_solved');
      if (storedSolved) {
        setSolvedSlugs(JSON.parse(storedSolved));
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }
  }

  const toggleProblem = (link: string) => {
    const slug = extractSlugFromUrl(link);
    let newSolved = [...solvedSlugs];
    if (newSolved.includes(slug)) {
      newSolved = newSolved.filter(s => s !== slug);
    } else {
      newSolved.push(slug);
    }
    setSolvedSlugs(newSolved);
    localStorage.setItem('grindguard_solved', JSON.stringify(newSolved));
  };

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
  });

  // Calculate stats
  const totalSolved = solvedSlugs.length;
  const totalProblems = problems.length;
  const progressPercentage = totalProblems > 0 ? (totalSolved / totalProblems) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-medium text-white tracking-tight">Study Plan</h1>
          <p className="text-zinc-500 text-sm mt-1">Striver's SDE Sheet</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalSolved} <span className="text-zinc-600 text-lg">/ {totalProblems}</span></div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Solved</div>
          </div>
          {/* Circular Progress or Simple Bar */}
          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="flex-1 relative group max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-zinc-400 focus:outline-none focus:border-zinc-600 text-sm"
        >
          <option value="all">Status</option>
          <option value="todo">Todo</option>
          <option value="solved">Solved</option>
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as FilterDifficulty)}
          className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-zinc-400 focus:outline-none focus:border-zinc-600 text-sm"
        >
          <option value="all">Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="w-full rounded-lg border border-zinc-800 overflow-hidden bg-black/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-zinc-500 font-medium border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 w-12 text-center">Status</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4 w-32">Topic</th>
              <th className="px-6 py-4 w-24">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredProblems.slice(0, 100).map((problem: any, idx) => {
              const slug = extractSlugFromUrl(problem.LeetCodeLink);
              const isSolved = solvedSlugs.includes(slug);

              // Determine color
              const diffColor = problem.Difficulty === 'Easy' ? 'text-teal-500' :
                problem.Difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500';

              return (
                <tr
                  key={idx}
                  className={`group hover:bg-zinc-900/60 transition-colors ${isSolved ? 'bg-zinc-900/20' : ''}`}
                  onClick={() => setSelectedProblem(problem)}
                >
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProblem(problem.LeetCodeLink);
                      }}
                      className="focus:outline-none"
                    >
                      {isSolved ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded border border-zinc-700 hover:border-zinc-500 transition-colors" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={problem.LeetCodeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-medium hover:text-blue-400 transition-colors ${isSolved ? 'text-zinc-500' : 'text-zinc-200'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {idx + 1}. {problem.QuestionName}
                      </a>
                      {problem.LeetCodeLink && (
                        <ExternalLink className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
                      {problem.Topic}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${diffColor}`}>
                    {problem.Difficulty}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProblems.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            No problems found.
          </div>
        )}
      </div>

    </div>
  );
}
