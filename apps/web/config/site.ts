export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Chiba Education Center',
  shortName: process.env.NEXT_PUBLIC_ORG_SHORT_NAME || 'CHIBA',
  description: 'Consultancy Management & Student Operations Platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  organization: {
    name: process.env.NEXT_PUBLIC_ORG_NAME || 'Chiba Education Center',
    shortName: process.env.NEXT_PUBLIC_ORG_SHORT_NAME || 'CHIBA',
    timezone: process.env.NEXT_PUBLIC_ORG_TIMEZONE || 'Asia/Kathmandu',
    currency: process.env.NEXT_PUBLIC_ORG_CURRENCY || 'NPR',
    locale: process.env.NEXT_PUBLIC_ORG_LOCALE || 'en-NP',
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
  },

  links: {
    support: 'mailto:support@chibaeducation.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;