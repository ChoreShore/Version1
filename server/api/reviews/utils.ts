import type { ReviewInput } from '~/schemas/review';

export const reviewSelect = `
  review_id,
  job_id,
  reviewer_id,
  reviewed_user_id,
  rating,
  comment,
  created_at,
  job:jobs(id,title),
  reviewer:profiles!reviews_reviewer_id_fkey(id, first_name, last_name),
  reviewed_user:profiles!reviews_reviewed_user_id_fkey(id, first_name, last_name)
`;

export type ReviewRow = {
  review_id: string;
  job_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string;
  job?: { id: string; title: string } | null;
  reviewer?: { id: string; first_name: string | null; last_name: string | null } | null;
  reviewed_user?: { id: string; first_name: string | null; last_name: string | null } | null;
};

export const mapReview = (row: ReviewRow): ReviewInput => ({
  id: row.review_id,
  review_id: row.review_id,
  job_id: row.job_id,
  reviewer_id: row.reviewer_id,
  reviewed_user_id: row.reviewed_user_id,
  rating: row.rating,
  comment: row.comment,
  created_at: row.created_at,
  updated_at: row.updated_at ?? row.created_at,
  job_title: row.job?.title,
  reviewer_first_name: row.reviewer?.first_name ?? undefined,
  reviewer_last_name: row.reviewer?.last_name ?? undefined,
  reviewed_user_first_name: row.reviewed_user?.first_name ?? undefined,
  reviewed_user_last_name: row.reviewed_user?.last_name ?? undefined
});
