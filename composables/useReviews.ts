import type {
  CreateReviewPayload,
  ReviewResponse,
  ReviewsResponse
} from '~/types/review';

export const useReviews = () => {
  const listReviews = async (type: 'received' | 'given' = 'received') => {
    const params = type === 'received' ? undefined : { type };
    return await $fetch<ReviewsResponse>('/api/reviews', { params });
  };

  const getJobReview = async (jobId: string) => {
    return await $fetch<ReviewResponse>(`/api/reviews/job/${jobId}`);
  };

  const listWorkerReviews = async (workerId: string) => {
    return await $fetch<ReviewsResponse>(`/api/reviews/worker/${workerId}`);
  };

  const createReview = async (payload: CreateReviewPayload) => {
    return await $fetch<ReviewResponse>('/api/reviews', {
      method: 'POST',
      body: payload
    });
  };

  return {
    listReviews,
    getJobReview,
    listWorkerReviews,
    createReview
  };
};
