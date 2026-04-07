import { z } from 'zod';

export const FeeCalculationSchema = z.object({
  job_amount: z.number().positive(),
  platform_fee_rate: z.number(),
  platform_fee_amount: z.number(),
  total_amount: z.number(),
  worker_payout_amount: z.number()
});

export const CreateEscrowSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID')
});

export const ConfirmEscrowSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID'),
  payment_intent_id: z.string().min(1, 'Payment intent ID is required')
});

export const ReleaseFundsSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID')
});

export const RefundEscrowSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID')
});

export const MockPaymentIntentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['requires_confirmation', 'succeeded', 'canceled', 'refunded']),
  platform_fee: z.number(),
  worker_payout: z.number()
});

export const EscrowPaymentResponseSchema = z.object({
  payment_intent: MockPaymentIntentSchema,
  escrow_id: z.string().uuid()
});

export const ConfirmEscrowResponseSchema = z.object({
  success: z.boolean(),
  contract_id: z.string().uuid(),
  escrow_status: z.string(),
  contract_status: z.string()
});

export const ReleaseFundsResponseSchema = z.object({
  success: z.boolean(),
  contract_id: z.string().uuid(),
  payout_amount: z.number(),
  escrow_status: z.string(),
  contract_status: z.string()
});

export const RefundEscrowResponseSchema = z.object({
  success: z.boolean(),
  contract_id: z.string().uuid(),
  refund_amount: z.number(),
  escrow_status: z.string(),
  contract_status: z.string()
});

export type FeeCalculation = z.infer<typeof FeeCalculationSchema>;
export type CreateEscrowInput = z.infer<typeof CreateEscrowSchema>;
export type ConfirmEscrowInput = z.infer<typeof ConfirmEscrowSchema>;
export type ReleaseFundsInput = z.infer<typeof ReleaseFundsSchema>;
export type RefundEscrowInput = z.infer<typeof RefundEscrowSchema>;
export type MockPaymentIntent = z.infer<typeof MockPaymentIntentSchema>;
export type EscrowPaymentResponse = z.infer<typeof EscrowPaymentResponseSchema>;
export type ConfirmEscrowResponse = z.infer<typeof ConfirmEscrowResponseSchema>;
export type ReleaseFundsResponse = z.infer<typeof ReleaseFundsResponseSchema>;
export type RefundEscrowResponse = z.infer<typeof RefundEscrowResponseSchema>;

export const validateCreateEscrow = (data: unknown) => {
  try {
    return { success: true, data: CreateEscrowSchema.parse(data), errors: null };
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

export const validateConfirmEscrow = (data: unknown) => {
  try {
    return { success: true, data: ConfirmEscrowSchema.parse(data), errors: null };
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

export const validateReleaseFunds = (data: unknown) => {
  try {
    return { success: true, data: ReleaseFundsSchema.parse(data), errors: null };
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

export const validateRefundEscrow = (data: unknown) => {
  try {
    return { success: true, data: RefundEscrowSchema.parse(data), errors: null };
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
