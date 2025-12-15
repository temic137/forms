import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/builder/', '/api/'],
    },
    sitemap: 'https://www.anyform.live/sitemap.xml',
  }
}

