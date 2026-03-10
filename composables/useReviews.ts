import type {
  CreateReviewInput,
  ReviewResponseInput,
  ReviewsResponseInput
} from '~/schemas/review';
import type { Role } from '~/schemas/role';

export const useReviews = () => {
  const listReviews = async (type: 'received' | 'given' = 'received', role?: Role) => {
    const params = { 
      ...(type !== 'received' ? { type } : {}),
      ...(role ? { role } : {})
    };
    return await $fetch<ReviewsResponseInput>('/api/reviews', { 
      params: Object.keys(params).length > 0 ? params : undefined 
    });
  };

  const getJobReview = async (jobId: string) => {
    return await $fetch<ReviewResponseInput>(`/api/reviews/job/${jobId}`);
  };

  const listWorkerReviews = async (workerId: string) => {
    return await $fetch<ReviewsResponseInput>(`/api/reviews/worker/${workerId}`);
  };

  const createReview = async (payload: CreateReviewInput) => {
    return await $fetch<ReviewResponseInput>('/api/reviews', {
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
