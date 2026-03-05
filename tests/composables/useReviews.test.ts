import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReviews } from '~/composables/useReviews';
import type { ReviewsResponse, ReviewResponse } from '~/types/review';

const reviewsComposable = useReviews();
const mockFetch = vi.fn();

describe('useReviews composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listReviews fetches received reviews by default', async () => {
    const response: ReviewsResponse = { reviews: [] };
    mockFetch.mockResolvedValue(response);

    const result = await reviewsComposable.listReviews();

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews', { params: undefined });
  });

  it('listReviews can fetch given reviews', async () => {
    const response: ReviewsResponse = { reviews: [] };
    mockFetch.mockResolvedValue(response);

    const result = await reviewsComposable.listReviews('given');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews', { params: { type: 'given' } });
  });

  it('getJobReview fetches review for a job', async () => {
    const response: ReviewResponse = {
      review: {
        review_id: 'rev-1',
        job_id: 'job-1',
        reviewer_id: 'employer-1',
        reviewed_user_id: 'worker-1',
        rating: 5,
        comment: 'Great job',
        created_at: '2025-01-01T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const result = await reviewsComposable.getJobReview('job-1');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews/job/job-1');
  });

  it('listWorkerReviews fetches reviews for worker', async () => {
    const response: ReviewsResponse = { reviews: [] };
    mockFetch.mockResolvedValue(response);

    const result = await reviewsComposable.listWorkerReviews('worker-1');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews/worker/worker-1');
  });

  it('createReview posts payload to /api/reviews', async () => {
    const response: ReviewResponse = {
      review: {
        review_id: 'rev-1',
        job_id: 'job-1',
        reviewer_id: 'employer-1',
        reviewed_user_id: 'worker-1',
        rating: 4,
        comment: 'Solid work',
        created_at: '2025-01-01T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = {
      job_id: 'job-1',
      reviewed_user_id: 'worker-1',
      rating: 4,
      comment: 'Solid work'
    };

    const result = await reviewsComposable.createReview(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews', {
      method: 'POST',
      body: payload
    });
  });
});
