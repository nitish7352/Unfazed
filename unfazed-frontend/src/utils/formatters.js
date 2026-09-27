import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a monetary amount in INR.
 */
export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

/**
 * Human-readable relative time (e.g. "2 hours ago", "yesterday").
 */
export const timeAgo = (date) => {
  const d = new Date(date);
  if (isToday(d))     return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return formatDistanceToNow(d, { addSuffix: true });
};

/**
 * Format session datetime for display.
 */
export const formatSessionTime = (startTime, duration) => {
  const start = new Date(startTime);
  const end   = new Date(start.getTime() + duration * 60_000);
  return `${format(start, 'MMM d, yyyy')} · ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
};

/**
 * Capitalise first letter.
 */
export const capitalise = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Convert snake_case to Title Case (e.g. 'no_show' → 'No Show').
 */
export const snakeToTitle = (str = '') =>
  str.split('_').map(capitalise).join(' ');
