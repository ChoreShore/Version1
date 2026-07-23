import { z } from 'zod';
import { validateSchema } from './validation';

export const ContractStatusSchema = z.enum(['pending', 'active', 'pending_review', 'completed', 'cancelled']);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const ContractSchema = z.object({
  id: z.string().uuid(),
  application_id: z.string().uuid(),
  employer_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  job_id: z.string().uuid(),
  status: ContractStatusSchema,
  payment_confirmed: z.boolean().optional(),
  escrow_amount: z.number().nullable().optional(),
  platform_fee: z.number().nullable().optional(),
  payout_amount: z.number().nullable().optional(),
  payment_intent_id: z.string().nullable().optional(),
  payout_status: z.enum(['pending', 'processed', 'failed', 'refunded']).nullable().optional(),
  worker_kyc_verified: z.boolean().nullable().optional(),
  frozen_budget_amount: z.number().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  worker_stripe_account_id: z.string().nullable().optional(),
  worker_completed_at: z.string().nullable().optional(),
  employer_approved_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export const ContractWithDetailsSchema = ContractSchema.extend({
  job_title: z.string().optional(),
  job_budget_amount: z.number().optional(),
  employer_first_name: z.string().optional(),
  employer_last_name: z.string().optional(),
  worker_first_name: z.string().optional(),
  worker_last_name: z.string().optional(),
  worker_username: z.string().nullable().optional(),
  worker_bio: z.string().nullable().optional()
});

export const ContractResponseSchema = z.object({
  contract: ContractWithDetailsSchema
});

export const ContractsResponseSchema = z.object({
  contracts: ContractWithDetailsSchema.array()
});

export const CreateContractSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  employer_id: z.string().uuid('Invalid employer ID'),
  worker_id: z.string().uuid('Invalid worker ID'),
  job_id: z.string().uuid('Invalid job ID')
});

export type ContractInput = z.infer<typeof ContractSchema>;
export type ContractWithDetailsInput = z.infer<typeof ContractWithDetailsSchema>;
export type ContractResponseInput = z.infer<typeof ContractResponseSchema>;
export type ContractsResponseInput = z.infer<typeof ContractsResponseSchema>;
export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const validateCreateContract = (data: unknown) => validateSchema(CreateContractSchema, data);

export const CompletionResponseSchema = z.object({
  success: z.literal(true),
  contract: ContractWithDetailsSchema
});
export type CompletionResponseInput = z.infer<typeof CompletionResponseSchema>;
