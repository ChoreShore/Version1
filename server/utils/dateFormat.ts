import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format a date to a consistent display format
 * @param date - Date string, Date object, or ISO string
 * @param formatStr - Format string (default: 'MMM d, yyyy')
 * @returns Formatted date string or 'Invalid date'
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, formatStr);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date to show relative time (e.g., "2 days ago")
 * @param date - Date string, Date object, or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date to include time
 * @param date - Date string, Date object, or ISO string
 * @returns Date and time string
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

/**
 * Format time only (e.g., "2:30 PM")
 * @param date - Date string, Date object, or ISO string
 * @returns Time string
 */
export function formatTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid time';
    return format(dateObj, 'h:mm a');
  } catch {
    return 'Invalid time';
  }
}

/**
 * Format a short date (e.g., "Jan 15")
 * @param date - Date string, Date object, or ISO string
 * @returns Short date string
 */
export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'MMM d');
}
