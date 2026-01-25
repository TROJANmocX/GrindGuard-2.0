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
        // Handle raw slug input just in case
        if (!url.includes('/')) return url.toLowerCase();

        const parts = url.split('/problems/');
        if (parts.length > 1) {
            let slug = parts[1];
            
            // Remove sub-routes like /description, /solution, /discuss
            slug = slug.split('/')[0];
            
            // Remove query parameters
            slug = slug.split('?')[0];

            return slug.trim().toLowerCase();
        }
        return url.toLowerCase();
    } catch (e) {
        return url.toLowerCase();
    }
};
