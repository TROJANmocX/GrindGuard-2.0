import { SolvedProblem } from './leetcode';

export const ATTENDANCE_STORAGE_KEY = 'grindguard_attendance_log';

export interface AttendanceStats {
    currentStreak: number;
    longestStreak: number;
    todayStatus: 'present' | 'absent';
    recentActivity: string[]; // List of YYYY-MM-DD dates
    history: string[]; // Full history
    lastPracticedDate: string | null;
}

export const getAttendanceHistory = (): string[] => {
    try {
        const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading attendance history:', error);
        return [];
    }
};

export const saveAttendanceHistory = (history: string[]) => {
    try {
        // Deduplicate and sort
        const uniqueDates = Array.from(new Set(history)).sort();
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(uniqueDates));
    } catch (error) {
        console.error('Error saving attendance history:', error);
    }
};

export const calculateAttendance = (mergedSolved: SolvedProblem[], submissionCalendar?: Record<string, number>): AttendanceStats => {
    // 1. Get existing history (potential corruption risk if previous version stored dummy data)
    let history = getAttendanceHistory();

    // 2. Extract dates from mergedSolved (Immediate/Manual Solves)
    const solvedDates = mergedSolved.map(p => {
        try {
            const isUnix = /^\d+$/.test(p.timestamp);
            const date = isUnix
                ? new Date(parseInt(p.timestamp) * 1000)
                : new Date(p.timestamp);

            return date.toISOString().split('T')[0];
        } catch (e) {
            return null;
        }
    }).filter(d => d !== null) as string[];

    // 2b. Extract dates from LeetCode Submission Calendar (Official Source of Truth)
    // Format: { "1706659200": 1, "1706745600": 3, ... } (Unix timestamps in seconds)
    const calendarDates: string[] = [];
    if (submissionCalendar) {
        Object.keys(submissionCalendar).forEach(ts => {
            try {
                const date = new Date(parseInt(ts) * 1000);
                calendarDates.push(date.toISOString().split('T')[0]);
            } catch (e) {
                // ignore invalid
            }
        });
    }

    // CRITICAL FIX: Prioritize API Data
    // If we have data from LeetCode standard calendar, we use THAT as the absolute history.
    // We strictly overwrite local history to purge any "365 day" dummy logs from previous versions.
    if (calendarDates.length > 0) {
        // Merge with current session solvedDates (for immediate updates before API refresh)
        const cleanHistory = Array.from(new Set([...calendarDates, ...solvedDates])).sort();

        // Overwrite LocalStorage with the clean, verified data
        saveAttendanceHistory(cleanHistory);
        history = cleanHistory;
    } else {
        // Fallback (Offline/API Fail): Use existing local history + new solves
        const newHistory = Array.from(new Set([...history, ...solvedDates])).sort();
        if (newHistory.length !== history.length) {
            saveAttendanceHistory(newHistory);
            history = newHistory;
        }
    }

    // 3. Calculate Stats
    // Shift "today" logic to support international users? 
    // Ideally use local time, but ISO split is UTC. 
    // If user's browser is ahead of UTC, they might lose a streak if we only check UTC date.
    // For now, let's trust the browser's notion of "Today" mapped to YYYY-MM-DD string.

    // Use local YYYY-MM-DD for checking "today" status
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Check both UTC and Local today to be generous
    const todayUTC = new Date().toISOString().split('T')[0];
    const isPresent = history.includes(todayLocal) || history.includes(todayUTC);

    const todayStatus = isPresent ? 'present' : 'absent';

    // Streak Calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Create a map for O(1) lookups
    const dateSet = new Set(history);

    // Current Streak Logic: Walk backwards from today (or yesterday if absent today)
    let cursorDate = new Date(); // Start with local now

    // If we haven't solved anything today (locally), we start checking from yesterday
    // BUT if we solved something "todayUTC" but it's "yesterdayLocal" (timezone mess), 
    // it's safer to just check: Is Today active? 
    // If Yes -> Streak includes today. Count = 1 + backwards.
    // If No -> Check yesterday. If active -> count = 1 + backwards.
    // If neither -> Streak = 0.

    // Helper to format date
    const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Anchor point
    let anchor = new Date();
    if (!dateSet.has(toYMD(anchor))) {
        // Not active today, check yesterday
        anchor.setDate(anchor.getDate() - 1);
        if (!dateSet.has(toYMD(anchor))) {
            currentStreak = 0; // Broken
        } else {
            currentStreak = 1; // Streak survives from yesterday
            cursorDate = anchor;
        }
    } else {
        currentStreak = 1; // Active today
        cursorDate = anchor;
    }

    if (currentStreak > 0) {
        // Walk backwards
        while (true) {
            cursorDate.setDate(cursorDate.getDate() - 1);
            if (dateSet.has(toYMD(cursorDate))) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Longest Streak Logic
    // We already have sorted 'history' (strings).
    // Just iterate linearly.
    if (history.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < history.length; i++) {
            const prev = new Date(history[i - 1]);
            const curr = new Date(history[i]);
            const diffTime = Math.abs(curr.getTime() - prev.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Round is safer

            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        }
    }

    // Retrieve last practiced
    const lastPracticedDate = history.length > 0 ? history[history.length - 1] : null;

    return {
        currentStreak,
        longestStreak,
        todayStatus,
        recentActivity: history.slice(-30), // Increased to 30 for better heatmaps if used
        history: history,
        lastPracticedDate
    };
};
