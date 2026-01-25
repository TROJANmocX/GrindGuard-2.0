import Papa from 'papaparse';
import { StriverProblem } from './csvParser';
import { extractSlugFromUrl } from '../utils/normalization';
import { getCachedData, setCachedData } from '../utils/cache';

export interface LeetCodeMetadata {
    id: string;
    title: string;
    acceptance_rate: number;
    frequency: number;
    url: string;
    companies: string[];
    likes: number;
    dislikes: number;
    is_premium: boolean;
}

export const loadLeetCodeMetadata = async (filePath: string = '/data/leetcode_metadata.csv'): Promise<Record<string, LeetCodeMetadata>> => {
    // Try to get from cache first
    const cached = getCachedData<Record<string, LeetCodeMetadata>>('metadata');
    if (cached) {
        console.log('✅ Loaded metadata from cache');
        return cached;
    }

    return new Promise((resolve) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length && results.errors[0].type !== 'Delimiter') {
                    console.error('Metadata CSV Parse Errors:', results.errors);
                }

                const metadataMap: Record<string, LeetCodeMetadata> = {};

                results.data.forEach((row: any) => {
                    if (!row.url) return;

                    try {
                        const slug = extractSlugFromUrl(row.url).toLowerCase();

                        // Parse companies: "Amazon,Google,..."
                        const companies = row.companies ? row.companies.split(',').map((c: string) => c.trim()) : [];

                        metadataMap[slug] = {
                            id: row.id,
                            title: row.title,
                            acceptance_rate: parseFloat(row.acceptance_rate || '0'),
                            frequency: parseFloat(row.frequency || '0'),
                            url: row.url,
                            companies,
                            likes: parseInt(row.likes || '0'),
                            dislikes: parseInt(row.dislikes || '0'),
                            is_premium: row.is_premium === '1'
                        };
                    } catch (e) {
                        // Silent fail for bad rows
                    }
                });

                console.log(`Loaded metadata for ${Object.keys(metadataMap).length} problems.`);

                // Cache the result
                setCachedData('metadata', metadataMap);

                resolve(metadataMap);
            },
            error: (error) => {
                console.error('Metadata Load Error:', error);
                // Resolve empty map to not break app
                resolve({});
            }
        });
    });
};

export interface EnrichedProblem extends StriverProblem {
    acceptanceRate?: number;
    frequency?: number;
    companies?: string[];
    isPremium?: boolean;
}

export const enrichProblems = (problems: StriverProblem[], metadata: Record<string, LeetCodeMetadata>): EnrichedProblem[] => {
    return problems.map(p => {
        const slug = extractSlugFromUrl(p.LeetCodeLink).toLowerCase();
        const meta = metadata[slug];

        if (meta) {
            return {
                ...p,
                acceptanceRate: meta.acceptance_rate,
                frequency: meta.frequency,
                companies: meta.companies,
                isPremium: meta.is_premium
            };
        }
        return p;
    });
};
