import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { PaymentMethodsResponseSchema } from '~/schemas/payment';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
    }

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
