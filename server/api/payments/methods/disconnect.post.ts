import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { PaymentMethodDisconnectSchema, PaymentMethodMutationResponseSchema } from '~/schemas/payment';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
    }

    const body = await readBody(event);
    const validation = PaymentMethodDisconnectSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.error.flatten().fieldErrors }
      });
    }

    const { role, method_type } = validation.data;
    const client = await serverSupabaseClient(event);
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('payment_methods')
      .update({
        connection_status: 'disconnected',
        verification_status: 'pending',
        updated_at: now
      })
      .eq('user_id', user.id)
      .eq('role', role)
      .eq('method_type', method_type)
      .select('*')
      .single();

    if (error || !data) {
      throw createError({ statusCode: 404, statusMessage: 'Payment method not found' });
    }

    return PaymentMethodMutationResponseSchema.parse({
      success: true,
      method: data
    });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to disconnect payment method'
    });
  }
});
