import { GoogleGenerativeAI } from '@google/generative-ai';
import { StriverProblem } from './csvParser';

// Initialize Gemini
const genAI = new GoogleGenerativeAI('AIzaSyBfD-iaQ__O1635nZaSzUiya7ZyYpAriyM');

export async function analyzeProfileWithGemini(
    username: string,
    striverSheet: StriverProblem[],
    solvedProblems: string[]
): Promise<{ matchedSlugs: string[], message: string }> {

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // We send a condensed version of the sheet to save tokens/complexity
    const sheetContext = striverSheet.map(p => `${p.QuestionName} (${p.Difficulty})`).join('\n');
    const userContext = solvedProblems.join(', ');

    const prompt = `
    You are an expert Coding Mentor (GrindGuard AI).
    
    CONTEXT:
    1. A "Striver SDE Sheet" (target list of problems).
    2. A User's "Solved List" (list of problem slugs/titles they have solved).

    TASK:
    - Compare the User's Solved List against the Striver Sheet.
    - Identify EXACT or HIGHLY PROBABLE matches.
    - Return a JSON object with:
      1. "matched_indices": Array of integers (0-based indices of the Striver Sheet items that are solved).
      2. "analysis": A short, ruthless, 2-sentence summary of their progress. (e.g. "You've barely touched the Hard problems. Do better." or "Good start on Arrays, but Graphs are empty.")

    STRIVER SHEET (Target):
    ${sheetContext}

    USER SOLVED LIST:
    ${userContext}

    RETURN JSON ONLY.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        // Map indices back to slugs
        const matchedSlugs = data.matched_indices.map((idx: number) => {
            if (striverSheet[idx]) {
                const url = striverSheet[idx].LeetCodeLink;
                // Extract slug roughly
                const parts = url.split('/problems/');
                if (parts.length > 1) return parts[1].replace('/', '');
                return url;
            }
            return null;
        }).filter(Boolean);

        return {
            matchedSlugs,
            message: data.analysis
        };

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        return {
            matchedSlugs: [],
            message: "AI Analysis failed. Syncing strictly by exact name match."
        };
    }
}
