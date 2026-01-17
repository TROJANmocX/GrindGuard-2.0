import { StriverProblem } from './csvParser';
import { SolvedProblem } from './leetcode';
import { extractSlugFromUrl } from '../utils/normalization';

export interface DailyMission {
    topic: string;
    problems: StriverProblem[];
    isComplete: boolean;
}

export const getDailyMission = (
    allProblems: StriverProblem[],
    solvedList: SolvedProblem[]
): DailyMission | null => {
    if (allProblems.length === 0) return null;

    const solvedSlugs = new Set(solvedList.map(p => p.problemSlug));

    // 1. Group by Topic and Calculate Weakness
    const problemsByTopic: Record<string, StriverProblem[]> = {};
    const statsByTopic: Record<string, { total: number; solved: number }> = {};

    allProblems.forEach(p => {
        if (!problemsByTopic[p.Topic]) {
            problemsByTopic[p.Topic] = [];
            statsByTopic[p.Topic] = { total: 0, solved: 0 };
        }
        problemsByTopic[p.Topic].push(p);
        statsByTopic[p.Topic].total++;

        const slug = extractSlugFromUrl(p.LeetCodeLink);
        if (solvedSlugs.has(slug)) {
            statsByTopic[p.Topic].solved++;
        }
    });

    // 2. Find Weakest Topic (Lowest Completion %)
    // Filter out topics that are 100% complete
    const incompleteTopics = Object.keys(statsByTopic).filter(
        topic => statsByTopic[topic].solved < statsByTopic[topic].total
    );

    if (incompleteTopics.length === 0) return null; // All done!

    // Sort by completion percentage (Ascending)
    incompleteTopics.sort((a, b) => {
        const rateA = statsByTopic[a].solved / statsByTopic[a].total;
        const rateB = statsByTopic[b].solved / statsByTopic[b].total;
        return rateA - rateB;
    });

    const targetTopic = incompleteTopics[0];
    const topicProblems = problemsByTopic[targetTopic];

    // 3. Select Problems (Prioritize Easy > Medium > Hard, but rotate daily)
    // We want 2 unsolved problems.
    const unsolvedInTopic = topicProblems.filter(p => {
        const slug = extractSlugFromUrl(p.LeetCodeLink);
        return !solvedSlugs.has(slug);
    });

    // Seeded Shuffle Helper
    const getSeededRandom = (seedStr: string) => {
        let h = 0xdeadbeef;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
        }
        return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h >>> 0) / 4294967296;
        };
    };

    const todayStr = new Date().toDateString(); // "Fri Jan 18 2026"
    const rng = getSeededRandom(todayStr + targetTopic); // Unique per topic per day

    // Group by Difficulty
    const easy = unsolvedInTopic.filter(p => !p.Difficulty || p.Difficulty.includes('Easy'));
    const medium = unsolvedInTopic.filter(p => p.Difficulty && p.Difficulty.includes('Medium'));
    const hard = unsolvedInTopic.filter(p => p.Difficulty && p.Difficulty.includes('Hard'));

    const shuffle = (arr: StriverProblem[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // Shuffle within tiers to ensure daily rotation
    const pool = [
        ...shuffle(easy),
        ...shuffle(medium),
        ...shuffle(hard)
    ];

    // Pick top 2
    const missionProblems = pool.slice(0, 2);

    return {
        topic: targetTopic,
        problems: missionProblems,
        isComplete: false
    };
};
