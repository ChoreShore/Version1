export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  proposed_rate: number | null;
  availability_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  job_title?: string;
  employer_name?: string;
  worker_name?: string;
}

export interface CreateApplicationPayload {
  job_id: string;
  cover_letter?: string;
  proposed_rate?: number;
  availability_notes?: string;
}

export interface UpdateApplicationPayload {
  status: ApplicationStatus;
}

export interface ApplicationsResponse {
  applications: ApplicationWithDetails[];
}

export interface ApplicationResponse {
  application: ApplicationWithDetails;
}

export interface JobApplicationsResponse {
  applications: Array<{
    id: string;
    worker_id: string;
    worker_name: string;
    status: ApplicationStatus;
    cover_letter: string | null;
    proposed_rate: number | null;
    created_at: string;
  }>;
}

export interface ApplicationStatsResponse {
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
  rejected_applications: number;
}
