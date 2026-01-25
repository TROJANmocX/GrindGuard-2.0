// Error types for better error handling
export enum ErrorType {
    API_FAILURE = 'API_FAILURE',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PARSE_ERROR = 'PARSE_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    UNKNOWN = 'UNKNOWN'
}

export interface AppError {
    type: ErrorType;
    message: string;
    action?: string;
    timestamp: Date;
    retryable: boolean;
}

export function createError(
    type: ErrorType,
    message: string,
    action?: string,
    retryable: boolean = false
): AppError {
    return {
        type,
        message,
        action,
        timestamp: new Date(),
        retryable
    };
}

// Retry with exponential backoff
export async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const delay = baseDelay * Math.pow(2, i); // Exponential backoff
            console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
    throw new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// User-friendly error messages
export function getErrorMessage(error: AppError): string {
    switch (error.type) {
        case ErrorType.API_FAILURE:
            return `Failed to fetch LeetCode data. ${error.action || 'Please try again later.'}`;
        case ErrorType.NETWORK_ERROR:
            return `Network connection failed. ${error.action || 'Check your internet connection.'}`;
        case ErrorType.PARSE_ERROR:
            return `Failed to process data. ${error.action || 'The data format may be incorrect.'}`;
        case ErrorType.AUTH_ERROR:
            return `Authentication failed. ${error.action || 'Please check your LeetCode username.'}`;
        default:
            return `An unexpected error occurred. ${error.action || 'Please try refreshing the page.'}`;
    }
}
