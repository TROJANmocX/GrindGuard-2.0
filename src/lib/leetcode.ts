import axios from 'axios';

const ALFA_LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';

export interface LeetCodeStats {
  status: string;
  message: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  acceptanceRate: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  submissionCalendar: Record<string, number>;
}

export interface SolvedProblem {
  problemSlug: string;
  problemTitle: string;
  language: string;
  timestamp: string;
}

export const fetchLeetCodeStats = async (username: string): Promise<LeetCodeStats | null> => {
  try {
    // Alfa API user profile endpoint
    // Switch to /userProfile as /dashboardalfa is flaky/404
    const response = await axios.get(`${ALFA_LEETCODE_API}/userProfile/${username}`);
    if (response.data) {
      // Map Alfa response to our interface
      /* Alfa /userProfile Response Sample:
      {
         "totalSolved": 123,
         "easySolved": 50,
         "ranking": 12345,
         "reputation": 10,
         ...
      }
      */
      return {
        status: 'success',
        message: 'retrieved',
        totalSolved: response.data.totalSolved || 0,
        totalQuestions: response.data.totalQuestions || 0,
        easySolved: response.data.easySolved || 0,
        totalEasy: response.data.totalEasy || 0,
        mediumSolved: response.data.mediumSolved || 0,
        totalMedium: response.data.totalMedium || 0,
        hardSolved: response.data.hardSolved || 0,
        totalHard: response.data.totalHard || 0,
        acceptanceRate: response.data.acceptanceRate || 0,
        ranking: response.data.ranking || 0,
        contributionPoints: response.data.contributionPoints || 0,
        reputation: response.data.reputation || 0,
        submissionCalendar: response.data.submissionCalendar || {}
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch LeetCode stats (userProfile):', error);
    // Fallback? Return null so UI hides it
    return null;
  }
};

export const fetchSolvedProblems = async (username: string): Promise<SolvedProblem[]> => {
  let allSolved: SolvedProblem[] = [];

  try {
    // Attempt 1: Get Full "Solved" List 
    // Endpoint: /user/solved (returns list of solved questions with slugs)
    // Alfa: /<username>/solved
    console.log(`Fetching solved problems for ${username}...`);
    try {
      const solvedResponse = await axios.get(`${ALFA_LEETCODE_API}/${username}/solved`);

      if (solvedResponse.data && Array.isArray(solvedResponse.data.solvedProblem)) {
        // Map to our structure
        const solved = solvedResponse.data.solvedProblem.map((p: any) => ({
          problemSlug: p.questionTitleSlug,
          problemTitle: p.questionTitle,
          language: 'unknown',
          timestamp: new Date().toISOString()
        }));
        allSolved = [...allSolved, ...solved];
      } else {
        console.warn("Full solved list format unexpected or empty:", solvedResponse.data);
      }
    } catch (e) {
      console.warn("Solved endpoint failed, trying fallback.", e);
    }

    // Fallback or Supplement: Try Recent Submissions (AC only)
    try {
      const recentResponse = await axios.get(`${ALFA_LEETCODE_API}/${username}/acSubmission`);
      if (recentResponse.data && Array.isArray(recentResponse.data.submission)) {
        const recent = recentResponse.data.submission.map((p: any) => ({
          problemSlug: p.titleSlug,
          problemTitle: p.title,
          language: p.lang,
          timestamp: p.timestamp
        }));
        allSolved = [...allSolved, ...recent];
      }
    } catch (e) {
      console.warn("Recent submissions endpoint failed.", e);
    }

    // Deduplicate based on slug
    const uniqueSolved = Array.from(new Map(allSolved.map(item => [item.problemSlug, item])).values());
    console.log(`[DEBUG] Final Unique Solved Count: ${uniqueSolved.length}`);
    if (uniqueSolved.length > 0) {
      console.log('[DEBUG] Latest 3 solved:', uniqueSolved.slice(-3));
    }

    return uniqueSolved;

  } catch (error) {
    console.error('Failed to fetch solved problems:', error);
    // CRITICAL: Return empty array, DO NOT FALLBACK TO FAKE DATA
    return [];
  }
};
