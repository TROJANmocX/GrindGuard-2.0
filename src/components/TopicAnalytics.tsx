import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, TopicStats } from '../lib/supabase';
import { TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';

export function TopicAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TopicStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopicStats();
  }, [user]);

  async function loadTopicStats() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('topic_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('total_attempted', { ascending: false });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading topic stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSuccessRate(stat: TopicStats): number {
    if (stat.total_attempted === 0) return 0;
    return Math.round((stat.total_solved / stat.total_attempted) * 100);
  }

  function getWeaknessLevel(successRate: number): { level: string; color: string; icon: typeof AlertTriangle } {
    if (successRate >= 70) {
      return { level: 'Strong', color: 'text-green-400', icon: TrendingUp };
    } else if (successRate >= 40) {
      return { level: 'Decent', color: 'text-yellow-400', icon: Target };
    } else {
      return { level: 'Trash', color: 'text-red-400', icon: TrendingDown };
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
        <p className="text-slate-400">
          Start solving problems to see your topic analytics and identify weaknesses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-2">Focus Map</h2>
        <p className="text-slate-500 mb-6 text-sm">
          A breakdown of your strengths and weaknesses.
        </p>

        <div className="space-y-4">
          {stats.map((stat) => {
            const successRate = getSuccessRate(stat);
            const weakness = getWeaknessLevel(successRate);
            const Icon = weakness.icon;

            return (
              <div
                key={stat.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-800 ${weakness.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{stat.topic}</h3>
                      <p className={`text-sm font-medium ${weakness.color}`}>
                        {weakness.level}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tabular-nums">{successRate}%</div>
                    <div className="text-xs text-slate-500">Success Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Attempted</div>
                    <div className="text-base font-bold text-white">{stat.total_attempted}</div>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Solved</div>
                    <div className="text-base font-bold text-green-500">{stat.total_solved}</div>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Easy</div>
                    <div className="text-base font-bold text-white">{stat.easy_solved}</div>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Medium</div>
                    <div className="text-base font-bold text-white">{stat.medium_solved}</div>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${successRate >= 70
                        ? 'bg-green-500'
                        : successRate >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    style={{ width: `${successRate}%` }}
                  />
                </div>

                {successRate < 40 && (
                  <div className="mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-orange-500 text-sm font-medium">
                      This area needs more work.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
