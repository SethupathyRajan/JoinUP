
/**
 * Utility to format dates consistently across the application,
 * handling standard Date objects, ISO strings, and Firestore Timestamps.
 */
export const formatDate = (date: any): string => {
    if (!date) return 'N/A';

    let dateObj: Date;

    // Handle Firestore Timestamp (_seconds, _nanoseconds)
    if (date && typeof date === 'object' && '_seconds' in date) {
        dateObj = new Date(date._seconds * 1000);
    }
    // Handle Firestore Timestamp (seconds, nanoseconds) - some versions
    else if (date && typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle already existing Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO strings or other parseable formats
    else {
        dateObj = new Date(date);
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Utility to format time
 */
export const formatTime = (date: any): string => {
    if (!date) return 'N/A';

    let dateObj: Date;

    if (date && typeof date === 'object' && '_seconds' in date) {
        dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Time';
    }

    return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};
