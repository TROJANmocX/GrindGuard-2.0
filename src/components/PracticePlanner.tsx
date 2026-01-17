import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, PracticePlan, TopicStats } from '../lib/supabase';
import { Target, Plus, CheckCircle, XCircle } from 'lucide-react';

const COMMON_TOPICS = [
  'Dynamic Programming',
  'Graphs',
  'Arrays',
  'Binary Search',
  'Trees',
  'Linked Lists',
  'Backtracking',
  'Greedy',
  'Strings',
  'Hash Tables',
];

export function PracticePlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PracticePlan[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPlans();
    loadTopicStats();
  }, [user]);

  async function loadPlans() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('practice_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTopicStats() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('topic_stats')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setTopicStats(data || []);
    } catch (error) {
      console.error('Error loading topic stats:', error);
    }
  }

  async function updatePlanStatus(planId: string, status: 'active' | 'completed' | 'abandoned') {
    try {
      await supabase
        .from('practice_plans')
        .update({ status })
        .eq('id', planId);

      await loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  }

  function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function getWeakestTopics(): string[] {
    const topicsWithStats = topicStats
      .map((stat) => ({
        topic: stat.topic,
        successRate: stat.total_attempted > 0 ? stat.total_solved / stat.total_attempted : 0,
      }))
      .sort((a, b) => a.successRate - b.successRate);

    return topicsWithStats.slice(0, 3).map((t) => t.topic);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400">Loading plans...</div>
      </div>
    );
  }

  const activePlans = plans.filter((p) => p.status === 'active');
  const completedPlans = plans.filter((p) => p.status === 'completed');
  const weakestTopics = getWeakestTopics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Practice Plans</h2>
          <p className="text-slate-400">Time-boxed goals. No decision paralysis.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      {weakestTopics.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-400 mb-2">Suggested Focus Areas</h3>
          <p className="text-slate-300 mb-3">Based on your weakest topics:</p>
          <div className="flex flex-wrap gap-2">
            {weakestTopics.map((topic) => (
              <span
                key={topic}
                className="px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-300 font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {activePlans.length > 0 && (
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-4">In Progress</h3>
          <div className="space-y-4">
            {activePlans.map((plan) => {
              const progress = (plan.completed_problems / plan.target_problems) * 100;
              const daysLeft = getDaysRemaining(plan.end_date);
              const isOverdue = daysLeft < 0;

              return (
                <div
                  key={plan.id}
                  className="bg-slate-900 rounded-lg p-6 border border-slate-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{plan.topic}</h4>
                      <p className="text-sm text-slate-500">
                        {plan.completed_problems} / {plan.target_problems} problems
                      </p>
                    </div>
                    <div className="text-right">
                      {isOverdue ? (
                        <div className="text-orange-500 font-medium text-sm">
                          {Math.abs(daysLeft)} days overdue
                        </div>
                      ) : (
                        <div className="text-slate-400 font-medium text-sm">
                          {daysLeft} days left
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-orange-600 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">{Math.round(progress)}%</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => updatePlanStatus(plan.id, 'completed')}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Done
                    </button>
                    <button
                      onClick={() => updatePlanStatus(plan.id, 'abandoned')}
                      className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Skip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedPlans.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">Completed Plans</h3>
          <div className="space-y-3">
            {completedPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-700/30 rounded-xl p-4 border border-slate-600 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white">{plan.topic}</h4>
                  <p className="text-sm text-slate-400">
                    {plan.completed_problems} / {plan.target_problems} problems
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activePlans.length === 0 && completedPlans.length === 0 && (
        <div className="bg-slate-950 rounded-xl p-12 text-center border border-dashed border-slate-900">
          <p className="text-slate-500 font-medium mb-2">No Active Focus Blocks</p>
          <p className="text-slate-600 text-sm">
            Set a specific goal to track your progress.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-orange-500 hover:text-orange-400 text-sm font-medium"
          >
            Create a block
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadPlans();
            setShowCreateModal(false);
          }}
          suggestedTopics={weakestTopics}
        />
      )}
    </div>
  );
}

function CreatePlanModal({
  onClose,
  onSuccess,
  suggestedTopics,
}: {
  onClose: () => void;
  onSuccess: () => void;
  suggestedTopics: string[];
}) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [targetProblems, setTargetProblems] = useState(10);
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!user || !topic.trim()) return;
    setLoading(true);

    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];

      await supabase.from('practice_plans').insert({
        user_id: user.id,
        topic: topic.trim(),
        start_date: startDate,
        end_date: endDate,
        target_problems: targetProblems,
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Create Practice Plan</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Dynamic Programming"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              list="topic-suggestions"
            />
            <datalist id="topic-suggestions">
              {COMMON_TOPICS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {suggestedTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">Suggested:</span>
                {suggestedTopics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-xs px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded text-orange-300 hover:bg-orange-500/30"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Problems: {targetProblems}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={targetProblems}
              onChange={(e) => setTargetProblems(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duration: {durationDays} days
            </label>
            <input
              type="range"
              min="3"
              max="30"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={loading || !topic.trim()}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
