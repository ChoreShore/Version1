export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/tokens.css'],
  modules: ['@nuxtjs/supabase', '@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Syne: [400, 600, 700, 800],
      'DM+Sans': [300, 400, 500]
    },
    display: 'swap',
    download: true,
    inject: true
  },
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
  app: {
    head: {
      script: [
        {
          id: 'cookieyes',
          src: 'https://cdn-cookieyes.com/client_data/9bb25d23d078fc5f7def7d3f609e04f1/script.js',
          type: 'text/javascript'
        }
      ]
    }
  },
  compatibilityDate: '2026-03-03'
});
