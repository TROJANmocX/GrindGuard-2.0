import { StriverProblem } from './csvParser';
import { SolvedProblem } from './leetcode';
import { extractSlugFromUrl } from '../utils/normalization';

export interface ProgressStats {
    totalProblems: number;
    completedProblems: number;
    remainingProblems: number;
    completionPercentage: number;
    topicBreakdown: Record<string, { total: number; completed: number }>;
}

export interface MatchedProblem {
    striverProblem: StriverProblem;
    isSolved: boolean;
}

export const calculateProgress = (
    striverSheet: StriverProblem[],
    userSolved: SolvedProblem[]
): { stats: ProgressStats; matchedList: MatchedProblem[] } => {
    // Normalize user solved slugs to lowercase for robust matching
    const userSolvedSlugs = new Set(userSolved.map((p) => p.problemSlug.toLowerCase()));

    const matchedList: MatchedProblem[] = striverSheet.map((problem) => {
        // Normalize Striver Sheet slug to lowercase
        const slug = extractSlugFromUrl(problem.LeetCodeLink).toLowerCase();
        const isSolved = userSolvedSlugs.has(slug);
        return {
            striverProblem: problem,
            isSolved,
        };
    });

    const completedCount = matchedList.filter((p) => p.isSolved).length;
    const totalCount = striverSheet.length;

    // Topic Breakdown
    const topicBreakdown: Record<string, { total: number; completed: number }> = {};

    matchedList.forEach((item) => {
        const topic = item.striverProblem.Topic || 'Unknown';
        if (!topicBreakdown[topic]) {
            topicBreakdown[topic] = { total: 0, completed: 0 };
        }
        topicBreakdown[topic].total += 1;
        if (item.isSolved) {
            topicBreakdown[topic].completed += 1;
        }
    });

    return {
        stats: {
            totalProblems: totalCount,
            completedProblems: completedCount,
            remainingProblems: totalCount - completedCount,
            completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
            topicBreakdown,
        },
        matchedList,
    };
};
