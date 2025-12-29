import { format, toDate } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Converts a local date object to a UTC ISO string
 * @param localDate The local date object
 * @returns ISO string in UTC
 */
export const toUTC = (localDate: Date): string => {
    return localDate.toISOString();
};

/**
 * Converts a UTC string to a local Date object
 * @param utcDateString The UTC date string
 * @returns Date object in local time
 */
export const toLocalTime = (utcDateString: string): Date => {
    return new Date(utcDateString);
};

/**
 * Formats a date in a specific timezone
 * @param date The date to format (can be Date object or ISO string)
 * @param timezone The timezone identifier (e.g., 'America/New_York')
 * @param formatStr The format string
 * @returns Formatted date string
 */
export const formatInTimezone = (
    date: Date | string,
    timezone: string,
    formatStr: string = 'PPpp'
): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(d, timezone, formatStr);
};

/**
 * Gets the user's local timezone
 * @returns Timezone identifier
 */
export const getLocalTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
