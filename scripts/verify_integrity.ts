
import { extractSlugFromUrl } from '../src/utils/normalization';

// Mock Data
const striverProblem = {
    QuestionName: "Two Sum",
    LeetCodeLink: "https://leetcode.com/problems/Two-Sum/",
    Topic: "Arrays"
};

const leetcodeSolved = {
    problemSlug: "two-sum", // Note lowercase from API
    problemTitle: "Two Sum"
};

const metadata = {
    "two-sum": {
        acceptance_rate: 46.7,
        companies: ["Amazon", "Google"]
    }
};

console.log("--- INTEGRITY CHECK ---");

// 1. Check Normalization
const s1 = extractSlugFromUrl(striverProblem.LeetCodeLink);
const s2 = leetcodeSolved.problemSlug;

console.log(`[Striver URL] ${striverProblem.LeetCodeLink} -> Slug: '${s1}'`);
console.log(`[LeetCode API] Slug: '${s2}'`);

if (s1 === s2) {
    console.log("✅ MATCH: Normalization is consistent (Case-insensitive match working).");
} else {
    console.error(`❌ FAIL: '${s1}' !== '${s2}'`);
}

// 2. Check Enrichment
const meta = metadata[s1];
if (meta) {
    console.log(`✅ MATCH: Metadata found for '${s1}'. Acceptance: ${meta.acceptance_rate}%`);
} else {
    console.error(`❌ FAIL: No metadata matched for '${s1}'`);
}

// 3. Check Mission Filtering Logic
const solvedSet = new Set([s2]);
const isHiddenFromMission = solvedSet.has(s1);

if (isHiddenFromMission) {
    console.log("✅ MATCH: Solved problem strictly excluded from Mission.");
} else {
    console.error("❌ FAIL: Solved problem would STILL appear in mission.");
}
