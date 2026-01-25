import { StriverProblem } from './csvParser';
import { SolvedProblem } from './leetcode';
import { extractSlugFromUrl } from '../utils/normalization';

export type MissionType = 'WEAKNESS' | 'REVIEW' | 'CHALLENGE';

export interface DailyMission {
    type: MissionType;
    title: string;
    description: string;
    problems: StriverProblem[];
    isComplete: boolean;
}

const REVIEW_INTERVAL_DAYS = 30;

export const getDailyMission = (
    allProblems: StriverProblem[],
    solvedList: SolvedProblem[]
): DailyMission | null => {
    if (allProblems.length === 0) return null;

    const solvedMap = new Map<string, SolvedProblem>();
    solvedList.forEach(p => solvedMap.set(p.problemSlug, p));
    const solvedSlugs = new Set(solvedList.map(p => p.problemSlug));

    // 1. Identification: Find Weak Topics & Stale Problems
    const problemsByTopic: Record<string, StriverProblem[]> = {};
    const statsByTopic: Record<string, { total: number; solved: number }> = {};
    const staleProblems: StriverProblem[] = [];

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

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

            // Check for Review (Spaced Repetition)
            const solvedData = solvedMap.get(slug);
            if (solvedData && solvedData.timestamp) {
                // Handle both ISO strings and Unix timestamps (seconds)
                let solvedTime = new Date(solvedData.timestamp).getTime();
                if (isNaN(solvedTime)) {
                    // Try parsing as unix seconds if string/number
                    const ts = Number(solvedData.timestamp);
                    if (!isNaN(ts)) solvedTime = ts * 1000;
                }

                if (!isNaN(solvedTime)) {
                    const daysSince = (now - solvedTime) / msInDay;
                    if (daysSince > REVIEW_INTERVAL_DAYS) {
                        staleProblems.push(p);
                    }
                }
            }
        }
    });

    // Seeded Random Helper
    const todayStr = new Date().toDateString();
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

    // Generic Shuffle
    const shuffle = <T>(arr: T[], seed: string): T[] => {
        const rng = getSeededRandom(todayStr + seed);
        const newArr = [...arr];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // DECISION TREE
    const rngChoice = getSeededRandom(todayStr + 'mission_type')();

    // 50% chance to triggers Review Mode if we have enough stale problems (>= 2)
    // Or if we have finished all topics (maintenance mode)
    const incompleteTopics = Object.keys(statsByTopic).filter(
        topic => statsByTopic[topic].solved < statsByTopic[topic].total
    );
    const isMaintenanceMode = incompleteTopics.length === 0;

    if ((staleProblems.length >= 2 && rngChoice > 0.5) || (isMaintenanceMode && staleProblems.length > 0)) {
        // --- REVIEW MISSION ---
        const reviewSet = shuffle(staleProblems, 'review').slice(0, 2);
        return {
            type: 'REVIEW',
            title: 'Memory Refresh',
            description: `Review these problems solved over ${REVIEW_INTERVAL_DAYS} days ago to strengthen retention.`,
            problems: reviewSet,
            isComplete: false // Logic for completion check needs to be handled in UI or derived
        };
    }

    // --- WEAKNESS MISSION (Default) ---
    if (incompleteTopics.length === 0) return null; // Literally nothing to do (no stale, no new)

    // Sort by completion %
    incompleteTopics.sort((a, b) => {
        const rateA = statsByTopic[a].solved / statsByTopic[a].total;
        const rateB = statsByTopic[b].solved / statsByTopic[b].total;
        return rateA - rateB;
    });

    // Pick top 3 weakest topics and randomly choose one to avoid monotony
    const topWeak = incompleteTopics.slice(0, 3);
    const targetTopic = topWeak[Math.floor(getSeededRandom(todayStr + 'topic')() * topWeak.length)];

    const topicProblems = problemsByTopic[targetTopic];
    const unsolvedInTopic = topicProblems.filter(p => !solvedSlugs.has(extractSlugFromUrl(p.LeetCodeLink)));

    // Categorize
    const easy = unsolvedInTopic.filter(p => p.Difficulty === 'Easy');
    const medium = unsolvedInTopic.filter(p => p.Difficulty === 'Medium');
    const hard = unsolvedInTopic.filter(p => p.Difficulty === 'Hard');

    // Mix: Prefer 1 Easy + 1 Medium, or 2 Medium
    // Fallback to whatever is available
    let missionProblems: StriverProblem[] = [];

    if (easy.length > 0 && medium.length > 0) {
        missionProblems = [shuffle(easy, 'e')[0], shuffle(medium, 'm')[0]];
    } else if (medium.length >= 2) {
        missionProblems = shuffle(medium, 'm').slice(0, 2);
    } else if (hard.length > 0 && medium.length > 0) {
        missionProblems = [shuffle(medium, 'm')[0], shuffle(hard, 'h')[0]];
    } else {
        // Fallback: just take any 2
        missionProblems = shuffle(unsolvedInTopic, 'fallback').slice(0, 2);
    }

    return {
        type: 'WEAKNESS',
        title: `${targetTopic} Attack`,
        description: `Your completion rate for ${targetTopic} is low. Crack these to level up!`,
        problems: missionProblems,
        isComplete: false
    };
};
