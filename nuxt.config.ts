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
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    }
  },
  typescript: {
    strict: true
  },
  routeRules: {
    '/api/**': {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()'
      }
    }
  },
  compatibilityDate: '2026-03-03'
});
