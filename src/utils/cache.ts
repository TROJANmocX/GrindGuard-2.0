// Performance optimization: Cache for metadata
const CACHE_KEY = 'leetcode_metadata_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export function getCachedData<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY}_${key}`);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - entry.timestamp > CACHE_DURATION) {
            localStorage.removeItem(`${CACHE_KEY}_${key}`);
            return null;
        }

        return entry.data;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

export function setCachedData<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(entry));
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

export function clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(CACHE_KEY)) {
            localStorage.removeItem(key);
        }
    });
}
