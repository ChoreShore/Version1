import { describe, it, expect } from 'vitest';
import { getRelativeTime } from '~/server/utils/time';

describe('getRelativeTime', () => {
  it('returns "Just now" for times under 60 seconds ago', () => {
    const now = new Date();
    const justNow = new Date(now.getTime() - 30_000).toISOString();
    expect(getRelativeTime(justNow)).toBe('Just now');
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();
    expect(getRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('returns "X minutes ago" for multiple minutes', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60_000).toISOString();
    expect(getRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns "X hours ago" for multiple hours', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60_000).toISOString();
    expect(getRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('returns "1 day ago" for exactly 1 day', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
    expect(getRelativeTime(oneDayAgo)).toBe('1 day ago');
  });

  it('returns "X days ago" for multiple days', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60_000).toISOString();
    expect(getRelativeTime(twoDaysAgo)).toBe('2 days ago');
  });

  it('returns "1 week ago" for exactly 1 week', () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString();
    expect(getRelativeTime(oneWeekAgo)).toBe('1 week ago');
  });

  it('returns "X weeks ago" for multiple weeks', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60_000).toISOString();
    expect(getRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns locale date string for times over 4 weeks', () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60_000).toISOString();
    const result = getRelativeTime(twoMonthsAgo);
    expect(result).not.toBe('Just now');
    expect(result).not.toContain('ago');
  });
});
