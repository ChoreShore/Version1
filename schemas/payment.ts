import { z } from 'zod';

export const PaymentStatusSchema = z.enum(['pending', 'processed', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentEventTypeSchema = z.enum(['employer_payment', 'worker_payout', 'refund']);
export type PaymentEventType = z.infer<typeof PaymentEventTypeSchema>;

export const PaymentActorRoleSchema = z.enum(['employer', 'worker', 'system']);
export type PaymentActorRole = z.infer<typeof PaymentActorRoleSchema>;

export const PaymentMethodTypeSchema = z.enum(['card', 'bank']);
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

export const PaymentMethodConnectionStatusSchema = z.enum(['connected', 'disconnected']);
export type PaymentMethodConnectionStatus = z.infer<typeof PaymentMethodConnectionStatusSchema>;

export const PaymentMethodVerificationStatusSchema = z.enum(['pending', 'verified']);
export type PaymentMethodVerificationStatus = z.infer<typeof PaymentMethodVerificationStatusSchema>;

export const CreatePaymentIntentSchema = z.object({
  application_id: z.string().uuid('Invalid application ID format'),
  idempotency_key: z.string().min(1).optional()
});

export const ConfirmPaymentSchema = z.object({
  application_id: z.string().uuid('Invalid application ID format'),
  payment_intent_id: z.string().min(1, 'Payment intent ID is required')
});

export const PayoutSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID format'),
  idempotency_key: z.string().min(1).optional()
});

export const PaymentMethodConnectSchema = z.object({
  role: z.enum(['employer', 'worker']),
  method_type: PaymentMethodTypeSchema,
  brand: z.string().max(30).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  display_label: z.string().max(80).optional()
});

export const PaymentMethodVerifySchema = z.object({
  role: z.enum(['employer', 'worker']),
  method_type: PaymentMethodTypeSchema
});

export const PaymentMethodDisconnectSchema = z.object({
  role: z.enum(['employer', 'worker']),
  method_type: PaymentMethodTypeSchema
});

export const PaymentEventSchema = z.object({
  id: z.string().uuid(),
  event_type: PaymentEventTypeSchema,
  status: PaymentStatusSchema,
  amount: z.number(),
  currency: z.string(),
  occurred_at: z.string(),
  job_id: z.string().uuid(),
  job_title: z.string(),
  application_id: z.string().uuid().nullable().optional(),
  contract_id: z.string().uuid().nullable().optional(),
  actor_role: PaymentActorRoleSchema,
  actor_user_id: z.string().uuid(),
  counterparty_name: z.string().nullable().optional(),
  payment_intent_id: z.string().nullable().optional()
});

export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['employer', 'worker']),
  method_type: PaymentMethodTypeSchema,
  provider: z.string(),
  connection_status: PaymentMethodConnectionStatusSchema,
  verification_status: PaymentMethodVerificationStatusSchema,
  brand: z.string().nullable().optional(),
  last4: z.string().nullable().optional(),
  display_label: z.string().nullable().optional(),
  connected_at: z.string().nullable().optional(),
  verified_at: z.string().nullable().optional(),
  updated_at: z.string()
});

export const PaymentIntentResponseSchema = z.object({
  success: z.literal(true),
  payment_intent_id: z.string(),
  client_secret: z.string(),
  amount: z.number(),
  platform_fee: z.number(),
  payout_amount: z.number(),
  status: PaymentStatusSchema,
  occurred_at: z.string(),
  idempotency_key: z.string().optional()
});

export const PaymentConfirmationResponseSchema = z.object({
  success: z.literal(true),
  status: z.literal('processed'),
  payment_intent_id: z.string(),
  occurred_at: z.string()
});

export const PayoutResponseSchema = z.object({
  success: z.literal(true),
  payout_amount: z.number(),
  status: z.literal('processed'),
  occurred_at: z.string()
});

export const PaymentsListResponseSchema = z.object({
  events: PaymentEventSchema.array()
});

export const PaymentMethodsResponseSchema = z.object({
  methods: PaymentMethodSchema.array()
});

export const PaymentMethodMutationResponseSchema = z.object({
  success: z.literal(true),
  method: PaymentMethodSchema
});

// Type exports
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>;
export type PayoutInput = z.infer<typeof PayoutSchema>;
export type PaymentIntentResponseInput = z.infer<typeof PaymentIntentResponseSchema>;
export type PaymentConfirmationResponseInput = z.infer<typeof PaymentConfirmationResponseSchema>;
export type PayoutResponseInput = z.infer<typeof PayoutResponseSchema>;
export type PaymentEventInput = z.infer<typeof PaymentEventSchema>;
export type PaymentsListResponseInput = z.infer<typeof PaymentsListResponseSchema>;
export type PaymentMethodInput = z.infer<typeof PaymentMethodSchema>;
export type PaymentMethodsResponseInput = z.infer<typeof PaymentMethodsResponseSchema>;
export type PaymentMethodConnectInput = z.infer<typeof PaymentMethodConnectSchema>;
export type PaymentMethodVerifyInput = z.infer<typeof PaymentMethodVerifySchema>;
export type PaymentMethodDisconnectInput = z.infer<typeof PaymentMethodDisconnectSchema>;
export type PaymentMethodMutationResponseInput = z.infer<typeof PaymentMethodMutationResponseSchema>;
