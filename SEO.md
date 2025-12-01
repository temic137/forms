# SEO Documentation for Forms

This document provides comprehensive guidance on SEO implementation, maintenance, and optimization for the Forms project.

## Table of Contents

1. [Meta Tags Implementation](#meta-tags-implementation)
2. [Sitemap and Robots.txt](#sitemap-and-robotstxt)
3. [Google Search Console Setup](#google-search-console-setup)
4. [Custom Domain with HTTPS on Vercel](#custom-domain-with-https-on-vercel)
5. [Performance Monitoring](#performance-monitoring)
6. [Updating Meta Tags for New Pages](#updating-meta-tags-for-new-pages)
7. [JSON-LD Structured Data](#json-ld-structured-data)

---

## Meta Tags Implementation

### Root Layout Metadata

The main metadata configuration is in `src/app/layout.tsx`. It includes:

- **Title Template**: Uses `%s | Forms` format for consistent branding
- **Description**: Compelling description for search results
- **Open Graph**: Social sharing metadata for Facebook, LinkedIn, etc.
- **Twitter Cards**: Large image summary cards for Twitter
- **Robots**: Search engine crawling directives
- **Canonical URLs**: Prevents duplicate content issues

### Page-Specific Metadata

Each page can override or extend the root metadata:

```tsx
// For Server Components (recommended)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title", // Will become "Page Title | Forms"
  description: "Page-specific description",
};

// For dynamic pages
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchData(params.id);
  return {
    title: data.title,
    description: data.description,
  };
}
```

### For Client Components

Use a layout file to provide metadata:

```tsx
// app/my-page/layout.tsx
export const metadata: Metadata = {
  title: "My Page",
  description: "Description for my page",
};

export default function Layout({ children }) {
  return children;
}
```

---

## Sitemap and Robots.txt

### Automatic Sitemap Generation

We use `next-sitemap` to automatically generate sitemaps after each build.

**Configuration file**: `next-sitemap.config.js`

```javascript
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://forms.example.com",
  generateRobotsTxt: true,
  exclude: ["/api/*", "/dashboard", "/auth/*"],
  // ... more options
};
```

**How it works:**

1. Run `npm run build`
2. `postbuild` script automatically runs `next-sitemap`
3. Generates `public/sitemap.xml` and `public/robots.txt`

### Customizing Sitemap Entries

To add or modify sitemap entries, edit `next-sitemap.config.js`:

```javascript
transform: async (config, path) => {
  return {
    loc: path,
    changefreq: "weekly",
    priority: 0.7,
    lastmod: new Date().toISOString(),
  };
};
```

### Robots.txt Configuration

The robots.txt is automatically generated and includes:

- Allow crawling of public pages
- Disallow private routes (dashboard, API, auth)
- Reference to sitemap location

---

## Google Search Console Setup

### Step 1: Verify Domain Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Choose "URL prefix" and enter your site URL
4. Verify using one of these methods:
   - **HTML tag** (recommended): Add the meta tag to `src/app/layout.tsx`
   - **DNS record**: Add a TXT record to your domain's DNS

### Step 2: Submit Sitemap

1. In Search Console, go to "Sitemaps"
2. Enter `sitemap.xml` in the URL field
3. Click "Submit"

### Step 3: Monitor Performance

- Check the "Performance" tab for search queries and clicks
- Review "Coverage" for indexing issues
- Use "URL Inspection" to check specific pages

### Step 4: Fix Common Issues

- **Crawl errors**: Check the "Coverage" report
- **Mobile usability**: Review the "Mobile Usability" report
- **Core Web Vitals**: Monitor in the "Experience" section

---

## Custom Domain with HTTPS on Vercel

### Prerequisites

- A Vercel account with your project deployed
- Access to your domain's DNS settings
- A domain name (e.g., myforms.com)

### Step 1: Add Domain in Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Domains**
3. Enter your domain name and click **Add**

### Step 2: Configure DNS Records

Vercel will show you the DNS records to add. Typically:

**For root domain (example.com):**

```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Wait for DNS Propagation

- DNS changes can take 1-48 hours to propagate
- Vercel will automatically issue an SSL certificate once DNS is verified

### Step 4: Verify HTTPS

1. Visit your domain with `https://`
2. Check for the padlock icon in the browser
3. Vercel automatically redirects HTTP to HTTPS

### Step 5: Update Environment Variables

Update your production environment:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### Troubleshooting

- **SSL not working**: Ensure DNS records are correct and wait for propagation
- **Redirect loops**: Check for conflicting redirect rules
- **Mixed content**: Ensure all assets use HTTPS

---

## Performance Monitoring

### Core Web Vitals

The project includes optimizations for Core Web Vitals:

1. **LCP (Largest Contentful Paint)**
   - Optimized font loading with `next/font`
   - Priority loading for above-fold images

2. **FID (First Input Delay)**
   - Minimal JavaScript bundle size
   - Code splitting per route

3. **CLS (Cumulative Layout Shift)**
   - Font display swap strategy
   - Proper image dimensions

### Monitoring Tools

1. **Google PageSpeed Insights**: [pagespeed.web.dev](https://pagespeed.web.dev)
2. **Google Search Console**: Core Web Vitals report
3. **Lighthouse**: Built into Chrome DevTools
4. **Vercel Analytics**: If enabled in Vercel dashboard

### Performance Optimization Tips

```tsx
// Use Next.js Image component
import Image from "next/image";

<Image
  src="/Preview.png"
  alt="Forms Preview"
  width={1200}
  height={630}
  priority // For above-fold images
/>

// Lazy load below-fold images
<Image
  src="/feature.png"
  alt="Feature"
  width={600}
  height={400}
  loading="lazy"
/>
```

---

## Updating Meta Tags for New Pages

### For Static Pages

Create a new page with metadata:

```tsx
// app/new-page/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Page Title",
  description: "Compelling description under 160 characters",
  openGraph: {
    title: "New Page Title",
    description: "Description for social sharing",
    images: ["/custom-og-image.png"],
  },
};

export default function NewPage() {
  return <div>Page content</div>;
}
```

### For Dynamic Pages

Use `generateMetadata`:

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}
```

### Best Practices Checklist

- [ ] Title is under 60 characters
- [ ] Description is 120-160 characters
- [ ] Unique title and description per page
- [ ] Open Graph image is 1200x630 pixels
- [ ] Alt text for all images
- [ ] Proper heading hierarchy (h1, h2, h3)

---

## JSON-LD Structured Data

### Available Schemas

The project includes pre-configured schemas in `src/lib/seo/json-ld.tsx`:

1. **WebSite Schema**: Main site information
2. **Organization Schema**: Business/team information
3. **Breadcrumb Schema**: Navigation path
4. **SoftwareApplication Schema**: App information

### Adding Structured Data to Pages

```tsx
import { JsonLd, generateBreadcrumbSchema } from "@/lib/seo/json-ld";

export default function Page() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Forms", url: "/forms" },
    { name: "Contact Form", url: "/forms/contact" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <div>Page content</div>
    </>
  );
}
```

### Testing Structured Data

1. Use [Google's Rich Results Test](https://search.google.com/test/rich-results)
2. Check for errors and warnings
3. Preview how your page might appear in search results

---

## Environment Variables

Set these for production:

```bash
# Required for proper canonical URLs and sitemaps
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# For NextAuth
NEXTAUTH_URL=https://yourdomain.com
```

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root metadata, JSON-LD |
| `src/lib/seo/json-ld.tsx` | Structured data utilities |
| `next-sitemap.config.js` | Sitemap configuration |
| `public/manifest.json` | PWA manifest |
| `public/robots.txt` | Crawler directives (auto-generated) |
| `public/sitemap.xml` | Sitemap (auto-generated) |

### Commands

```bash
# Build and generate sitemap
npm run build

# Run development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

---

## Additional Resources

- [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Web.dev SEO Guide](https://web.dev/learn/seo)
