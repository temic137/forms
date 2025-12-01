/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://forms.example.com",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  
  // Exclude private/admin routes from sitemap
  exclude: [
    "/api/*",
    "/dashboard",
    "/dashboard/*",
    "/forms/*",
    "/builder/*",
    "/auth/signin",
    "/auth/signup",
    "/create/*",
  ],
  
  // Robots.txt policies
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/forms/",
          "/builder/",
          "/auth/",
          "/create/",
        ],
      },
    ],
    additionalSitemaps: [
      // Add dynamic sitemaps here if needed
    ],
  },
  
  // Transform function for custom sitemap entries
  transform: async (config, path) => {
    // Set priority based on path
    let priority = 0.7;
    let changefreq = "weekly";
    
    if (path === "/") {
      priority = 1.0;
      changefreq = "daily";
    } else if (path.startsWith("/f/")) {
      // Public form pages - moderate priority
      priority = 0.5;
      changefreq = "monthly";
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  
  // Additional paths to include in sitemap
  additionalPaths: async (config) => {
    // Add any static pages here
    return [];
  },
};

module.exports = config;
