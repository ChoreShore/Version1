/**
 * Common Supabase select fragments to avoid duplication across endpoints.
 */

export const JOB_SELECT_WITH_RELATIONS = `
  *,
  employer:profiles!employer_id(first_name, last_name),
  category:job_categories!category_id(name)
`;
