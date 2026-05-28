import { serverSupabaseClient } from '#supabase/server';
import { PaymentMethodsResponseSchema } from '~/schemas/payment';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Authentication required');

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return PaymentMethodsResponseSchema.parse({ methods: data ?? [] });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to load payment methods'
    });
  }
});
