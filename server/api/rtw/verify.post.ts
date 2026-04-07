import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateRtwVerify, RtwApiResponseSchema } from '~/schemas/rtw';

function parseApiDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const OUTCOME_MESSAGES: Record<string, string> = {
  REJECTED: 'The share code was found but right to work could not be confirmed. Please check your details and try again.',
  NOT_FOUND: 'Share code not found. Please check the code and try again.',
  SHARE_CODE_LOCKED: 'This share code is temporarily locked due to too many checks. Please wait 10 minutes and try again.',
  SHARE_CODE_EXPIRED: 'This share code has expired. Please obtain a new share code from the Home Office.'
};

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Sign in to verify your right to work' });
    }

    const body = await readBody(event);

    const validation = validateRtwVerify(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const { code, dob, forename, surname } = validation.data;

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      throw createError({ statusCode: 500, statusMessage: 'RTW service is not configured' });
    }

    const params = new URLSearchParams({
      code,
      dob,
      forename,
      surname,
      company_name: 'ChoreShore'
    });

    const apiResponse = await $fetch(
      `https://uk-right-to-work-sharecode-checker.p.rapidapi.com/rtw?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'uk-right-to-work-sharecode-checker.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const parsed = RtwApiResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      throw createError({ statusCode: 502, statusMessage: 'Unexpected response from RTW service' });
    }

    const { outcome, name, expiry_date } = parsed.data.status;

    if (outcome === 'ACCEPTED') {
      const expiryIso = parseApiDate(expiry_date);
      const client = await serverSupabaseClient(event);

      const { error: updateError } = await client
        .from('profiles')
        .update({
          rtw_status: 'verified',
          rtw_expiry_date: expiryIso,
          rtw_verified_at: new Date().toISOString(),
          rtw_full_name: name ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw createError({ statusCode: 400, statusMessage: updateError.message });
      }

      return {
        success: true,
        outcome,
        name,
        expiry_date: expiryIso
      };
    }

    return {
      success: false,
      outcome,
      message: OUTCOME_MESSAGES[outcome] ?? 'Verification failed. Please try again.'
    };
  } catch (error: any) {
    if (
      error.message?.includes('Auth session missing') ||
      error.message?.includes('session') ||
      error.statusCode === 401
    ) {
      if (error.statusCode === 401) throw error;
      throw createError({ statusCode: 401, statusMessage: 'Auth session missing!' });
    }
    throw error;
  }
});
