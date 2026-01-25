import fs from 'fs';
import Papa from 'papaparse';

// Normalize a string for comparison
function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Extract keywords from a string
function extractKeywords(str) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

    return normalize(str)
        .split(' ')
        .filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate similarity score
function calculateScore(striverName, lcTitle, lcDescription) {
    const striverWords = new Set(extractKeywords(striverName));
    const titleWords = new Set(extractKeywords(lcTitle));
    const descWords = new Set(extractKeywords(lcDescription || ''));

    // Title match score (weighted heavily)
    const titleIntersection = new Set([...striverWords].filter(x => titleWords.has(x)));
    const titleScore = titleIntersection.size / Math.max(striverWords.size, titleWords.size) * 100;

    // Description match score (lighter weight)
    const descIntersection = new Set([...striverWords].filter(x => descWords.has(x)));
    const descScore = descIntersection.size / striverWords.size * 30;

    return titleScore + descScore;
}

// Manual mappings for common problems that don't match well
const manualMappings = {
    'two sum': 'two-sum',
    '2 sum': 'two-sum',
    'three sum': '3sum',
    '3 sum': '3sum',
    'four sum': '4sum',
    '4 sum': '4sum',
    'kadanes algorithm': 'maximum-subarray',
    'stock buy sell': 'best-time-to-buy-and-sell-stock',
    'next permutation': 'next-permutation',
    'set matrix 0s': 'set-matrix-zeroes',
    'rotate matrix': 'rotate-image',
    'spiral traversal': 'spiral-matrix',
    'pascal triangle': 'pascals-triangle',
    'majority element': 'majority-element',
    'reverse pairs': 'reverse-pairs',
    'maximum product subarray': 'maximum-product-subarray',
    'missing number': 'missing-number',
    'max consecutive 1s': 'max-consecutive-ones',
    'search insert position': 'search-insert-position',
    'first and last position': 'find-first-and-last-position-of-element-in-sorted-array',
    'find peak element': 'find-peak-element',
    'search in rotated sorted array': 'search-in-rotated-sorted-array',
    'median of two sorted arrays': 'median-of-two-sorted-arrays',
    'valid parenthesis': 'valid-parentheses',
    'implement min stack': 'min-stack',
    'trapping rainwater': 'trapping-rain-water',
    'largest rectangle in histogram': 'largest-rectangle-in-histogram',
    'lru cache': 'lru-cache',
    'valid anagram': 'valid-anagram',
    'longest palindromic substring': 'longest-palindromic-substring',
    'reverse linked list': 'reverse-linked-list',
    'detect cycle': 'linked-list-cycle',
    'palindrome linked list': 'palindrome-linked-list',
    'merge two sorted lists': 'merge-two-sorted-lists',
    'copy list with random pointer': 'copy-list-with-random-pointer',
    'flatten linked list': 'flatten-a-multilevel-doubly-linked-list',
    'climbing stairs': 'climbing-stairs',
    'house robber': 'house-robber',
    'unique paths': 'unique-paths',
    'minimum path sum': 'minimum-path-sum',
    'coin change': 'coin-change',
    'longest common subsequence': 'longest-common-subsequence',
    'longest increasing subsequence': 'longest-increasing-subsequence',
    'word break': 'word-break',
    'n queens': 'n-queens',
    'sudoku solver': 'sudoku-solver',
    'permutations': 'permutations',
    'combinations': 'combinations',
    'subsets': 'subsets',
};

async function fixLinksAdvanced() {
    console.log('🔍 Loading Striver Sheet...');
    const striverData = fs.readFileSync('public/data/striver_sheet_fixed.csv', 'utf8');
    const striverParsed = Papa.parse(striverData, { header: true });
    const striverProblems = striverParsed.data;

    console.log(`✅ Loaded ${striverProblems.length} problems from Striver Sheet`);

    console.log('🔍 Loading LeetCode Metadata...');
    const leetcodeData = fs.readFileSync('leetcode_dataset - lc.csv', 'utf8');
    const leetcodeParsed = Papa.parse(leetcodeData, { header: true });
    const leetcodeProblems = leetcodeParsed.data.filter(p => p.title && p.url);

    // Create a map for quick slug lookup
    const slugMap = new Map();
    leetcodeProblems.forEach(p => {
        const slug = p.url.split('/problems/')[1]?.replace('/', '');
        if (slug) {
            slugMap.set(slug, p);
        }
    });

    console.log(`✅ Loaded ${leetcodeProblems.length} problems from LeetCode dataset`);
    console.log('\n🔧 Matching problems with advanced algorithm...\n');

    let matched = 0;
    let improved = 0;
    let notMatched = 0;
    const results = [];

    for (const striverProblem of striverProblems) {
        if (!striverProblem.ProblemName) continue;

        const cleanName = striverProblem.ProblemName
            .replace(/^\d+\./, '')
            .replace(/\.(cpp|java|py)$/, '')
            .replace(/_/g, ' ')
            .trim();

        const normalizedName = normalize(cleanName);

        // Strategy 1: Check manual mappings first
        let matched = false;
        for (const [key, slug] of Object.entries(manualMappings)) {
            if (normalizedName.includes(key)) {
                const lcProblem = slugMap.get(slug);
                if (lcProblem) {
                    const oldLink = striverProblem.LeetCodeLink;
                    striverProblem.LeetCodeLink = lcProblem.url;

                    if (oldLink !== lcProblem.url) {
                        console.log(`🔧 "${cleanName}" → "${lcProblem.title}" (manual mapping)`);
                        improved++;
                    }
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            // Strategy 2: Advanced fuzzy matching
            let bestMatch = null;
            let bestScore = 0;

            for (const lcProblem of leetcodeProblems) {
                const score = calculateScore(cleanName, lcProblem.title, lcProblem.description);

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = lcProblem;
                }
            }

            // Accept matches with >50% score (lowered threshold)
            if (bestMatch && bestScore > 50) {
                const oldLink = striverProblem.LeetCodeLink;
                striverProblem.LeetCodeLink = bestMatch.url;

                if (oldLink !== bestMatch.url) {
                    console.log(`✅ "${cleanName}" → "${bestMatch.title}" (${bestScore.toFixed(0)}%)`);
                    improved++;
                } else {
                    matched++;
                }
            } else {
                notMatched++;
                console.log(`❌ "${cleanName}" → No match (best: ${bestScore.toFixed(0)}%)`);
            }
        }

        results.push(striverProblem);
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Already Matched: ${matched}`);
    console.log(`   🔧 Improved: ${improved}`);
    console.log(`   ❌ Still Not Matched: ${notMatched}`);
    console.log(`   📈 Total Coverage: ${((matched + improved) / results.length * 100).toFixed(1)}%`);

    // Write updated CSV
    const csv = Papa.unparse(results);
    fs.writeFileSync('public/data/striver_sheet_fixed.csv', csv);
    console.log(`\n💾 Saved to: public/data/striver_sheet_fixed.csv`);
}

fixLinksAdvanced().catch(console.error);
