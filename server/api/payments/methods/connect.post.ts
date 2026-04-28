import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { PaymentMethodConnectSchema, PaymentMethodMutationResponseSchema } from '~/schemas/payment';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
    }

    const body = await readBody(event);
    const validation = PaymentMethodConnectSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.error.flatten().fieldErrors }
      });
    }

    const { role, method_type, brand, last4, display_label } = validation.data;
    const client = await serverSupabaseClient(event);
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('payment_methods')
      .upsert(
        {
          user_id: user.id,
          role,
          method_type,
          provider: 'stripe_mock',
          connection_status: 'connected',
          verification_status: 'pending',
          brand: brand ?? null,
          last4: last4 ?? null,
          display_label: display_label ?? null,
          connected_at: now,
          updated_at: now
        },
        { onConflict: 'user_id,role,method_type' }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw createError({ statusCode: 500, statusMessage: error?.message || 'Failed to connect payment method' });
    }

    return PaymentMethodMutationResponseSchema.parse({
      success: true,
      method: data
    });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to connect payment method'
    });
  }
});
