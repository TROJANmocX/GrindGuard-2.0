import Papa from 'papaparse';

export interface StriverProblem {
    QuestionName: string;
    LeetCodeLink: string;
    Topic: string;
    Difficulty: string;
    TimeComplexity: string;
    SpaceComplexity: string;
}

export const parseStriverSheet = async (filePath: string = '/data/striver_sheet_fixed.csv'): Promise<StriverProblem[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length && results.errors[0].type !== 'Delimiter') {
                    console.error('CSV Parse Errors:', results.errors);
                }

                const parsed: StriverProblem[] = results.data.map((row: any) => {
                    // Default values
                    let name = row.QuestionName || row.ProblemName || 'Unknown';
                    let link = row.LeetCodeLink || '';
                    let topic = 'Unknown';
                    let difficulty = 'Unknown';

                    // logic for "Raw Dump" format (NEW DTA.csv)
                    // Columns: Topic,ProblemName,Difficulty,TimeComplexity,SpaceComplexity,FilePath,LeetCodeLink
                    // Note: 'Topic' column is often sub-topic (e.g. "1.Easy"), 'Difficulty' is often "Unknown"

                    if (row.FilePath) {
                        try {
                            // 1. Clean Name: "01.Largest_element_in_array.cpp" -> "Largest Element in Array"
                            if (row.ProblemName) {
                                name = row.ProblemName
                                    .replace(/^\d+\./, '') // Remove lead numbering "01."
                                    .replace(/\.(cpp|java|py)$/, '') // Remove extension
                                    .replace(/_/g, ' '); // Replace underscores
                            }

                            // 2. Generate Link/Slug
                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                            if (!link) {
                                link = `https://leetcode.com/problems/${slug}`;
                            }

                            // 3. Extract Meta from Path: "Strivers-A2Z-DSA-Sheet\01.Arrays\1.Easy\..."
                            const parts = row.FilePath.split('\\');
                            if (parts.length >= 3) {
                                // Extraction Strategy:
                                // part[0] = "Strivers-A2Z-DSA-Sheet"
                                // part[1] = "01.Arrays" (Main Topic)
                                // part[2] = "1.Easy" (Difficulty or Subtopic)

                                // Topic
                                const rawTopic = parts[1];
                                topic = rawTopic.replace(/^\d+\./, '').trim(); // "Arrays"

                                // Difficulty
                                // Check column first? No, column is often "Unknown". Check path part[2].
                                const rawDiff = parts[2];
                                if (rawDiff.toLowerCase().includes('easy')) difficulty = 'Easy';
                                else if (rawDiff.toLowerCase().includes('medium')) difficulty = 'Medium';
                                else if (rawDiff.toLowerCase().includes('hard')) difficulty = 'Hard';
                            }
                        } catch (e) {
                            console.warn('Error parsing row:', row);
                        }
                    } else {
                        // Fallback for older CSV formats if any
                        topic = row.Topic || 'Unknown';
                        difficulty = row.Difficulty || 'Unknown';
                    }

                    // Final Fallback for Difficulty if still unknown but we have a Topic like "1.Easy"
                    if (difficulty === 'Unknown' && row.Topic) {
                        if (row.Topic.toLowerCase().includes('easy')) difficulty = 'Easy';
                        else if (row.Topic.toLowerCase().includes('medium')) difficulty = 'Medium';
                        else if (row.Topic.toLowerCase().includes('hard')) difficulty = 'Hard';
                    }

                    return {
                        QuestionName: name,
                        LeetCodeLink: link,
                        Topic: topic,
                        Difficulty: difficulty,
                        TimeComplexity: row.TimeComplexity || 'Unknown',
                        SpaceComplexity: row.SpaceComplexity || 'Unknown'
                    };
                }).filter(p => p.QuestionName !== 'Unknown' && !p.QuestionName.includes('Striver'));

                resolve(parsed);
            },
            error: (error) => {
                console.error('CSV Load Error:', error);
                reject(error);
            }
        });
    });
};
