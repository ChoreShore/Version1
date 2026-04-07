import { z } from 'zod';

export const ContractStatusSchema = z.enum(['pending', 'active', 'completed', 'cancelled']);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const EscrowStatusSchema = z.enum(['held', 'released', 'refunded']);
export type EscrowStatus = z.infer<typeof EscrowStatusSchema>;

export const TransactionTypeSchema = z.enum(['deposit', 'release', 'refund', 'fee']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const ContractSchema = z.object({
  id: z.string().uuid(),
  application_id: z.string().uuid(),
  employer_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  job_id: z.string().uuid(),
  status: ContractStatusSchema,
  created_at: z.string(),
  updated_at: z.string()
});

export const EscrowPaymentSchema = z.object({
  id: z.string().uuid(),
  contract_id: z.string().uuid(),
  stripe_payment_intent_id: z.string().nullable().optional(),
  total_amount: z.number(),
  platform_fee: z.number(),
  worker_payout_amount: z.number(),
  status: EscrowStatusSchema,
  created_at: z.string()
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  contract_id: z.string().uuid().nullable().optional(),
  amount: z.number(),
  transaction_type: TransactionTypeSchema,
  stripe_transaction_id: z.string().nullable().optional(),
  created_at: z.string()
});

export const ContractWithDetailsSchema = ContractSchema.extend({
  escrow_payment: EscrowPaymentSchema.nullable().optional(),
  transactions: TransactionSchema.array().optional(),
  job_title: z.string().optional(),
  job_budget_amount: z.number().optional(),
  employer_first_name: z.string().optional(),
  employer_last_name: z.string().optional(),
  worker_first_name: z.string().optional(),
  worker_last_name: z.string().optional()
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
export type EscrowPaymentInput = z.infer<typeof EscrowPaymentSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type ContractResponseInput = z.infer<typeof ContractResponseSchema>;
export type ContractsResponseInput = z.infer<typeof ContractsResponseSchema>;
export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const validateCreateContract = (data: unknown) => {
  try {
    return { success: true, data: CreateContractSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          acc[err.path[0] as string] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};
