export const STORAGE_KEYS = {
    MANUAL_SOLVED: 'grindguard_manual_solved',
};

export const getManualSolved = (): string[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.MANUAL_SOLVED);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading manual solved from storage:', error);
        return [];
    }
};

export const toggleManualSolved = (slug: string): string[] => {
    try {
        const current = getManualSolved();
        const index = current.indexOf(slug);
        let updated: string[];

        if (index > -1) {
            updated = current.filter(s => s !== slug);
        } else {
            updated = [...current, slug];
        }

        localStorage.setItem(STORAGE_KEYS.MANUAL_SOLVED, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error('Error updating manual solved in storage:', error);
        return [];
    }
};
