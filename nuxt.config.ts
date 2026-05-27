export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/tokens.css'],
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  typescript: {
    strict: true
  },
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      diditUnilinkUrl: process.env.DIDIT_UNILINK_URL
    }
  },
  routeRules: {
    '/api/**': {
      headers: {
        // Removed 'unsafe-eval' from script-src (most dangerous)
        // TODO: Replace 'unsafe-inline' with nonce or hash-based CSP for production
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=()'
      }
    }
  },
  compatibilityDate: '2026-03-03'
});
