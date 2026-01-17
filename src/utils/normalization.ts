/**
 * Normalizes problem names for consistent matching.
 * e.g., "Two Sum" -> "two-sum"
 * "Best Time to Buy and Sell Stock" -> "best-time-to-buy-and-sell-stock"
 */
export const normalizeProblemName = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
};

/**
 * Normalizes LeetCode URL slug.
 * e.g., "https://leetcode.com/problems/two-sum" -> "two-sum"
 */
export const extractSlugFromUrl = (url: string): string => {
    try {
        const parts = url.split('/problems/');
        if (parts.length > 1) {
            // Remove trailing slash if present
            return parts[1].replace(/\/$/, '');
        }
        return url;
    } catch (e) {
        return url;
    }
};
