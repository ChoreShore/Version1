export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/tokens.css'],
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    cookieOptions: {
      name: 'sb-access-token',
      lifetime: 60 * 60 * 4,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  },
  typescript: {
    strict: true
  },
  compatibilityDate: '2026-03-03'
});
