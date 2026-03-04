export type BudgetType = 'fixed' | 'hourly';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface JobCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  category_id: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  budget_type: BudgetType;
  budget_amount: number;
  deadline: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobPreview {
  id: string;
  title: string;
  description_preview: string;
  category_id: string;
    category_name: string;

  postcode_area: string;
  budget_type: BudgetType;
  budget_display: string;
  created_at: string;
  cta: string;
}

export interface JobWithDetails extends Job {
  employer_first_name?: string;
  employer_last_name?: string;
  category_name?: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  category_id: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  budget_type: BudgetType;
  budget_amount: number;
  deadline: string;
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  category_id?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  budget_type?: BudgetType;
  budget_amount?: number;
  deadline?: string;
  status?: JobStatus;
}

export interface JobsResponse {
  jobs: Job[] | JobPreview[];
  preview_mode: boolean;
}

export interface JobResponse {
  job: Job | JobWithDetails;
}

export interface CategoriesResponse {
  categories: JobCategory[];
}

export interface JobsQuery {
  limit?: string;      
  category?: string;
  postcode?: string;
  lat?: string;        
  lng?: string;      
  distance?: string;   
}

export interface NearJobsResponse {
  jobs: Array<{
    job_id: string;
    title: string;
    distance_km: number;
  }>;
}