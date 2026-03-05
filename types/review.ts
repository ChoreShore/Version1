export interface Review {
  review_id: string;
  job_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  job_title?: string;
  reviewer_first_name?: string | null;
  reviewer_last_name?: string | null;
  reviewed_user_first_name?: string | null;
  reviewed_user_last_name?: string | null;
}

export interface CreateReviewPayload {
  job_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string | null;
}

export interface ReviewsResponse {
  reviews: Review[];
}

export interface ReviewResponse {
  review: Review;
}
