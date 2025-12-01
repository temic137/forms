import type { Thing, WithContext, WebSite, Organization } from "schema-dts";

// Base URL for production
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://forms.example.com";

/**
 * JSON-LD component for structured data
 */
export function JsonLd<T extends Thing>({
  data,
}: {
  data: WithContext<T>;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * WebSite schema for the main site
 */
export const websiteSchema: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Forms - AI Form Builder",
  description:
    "Beautiful forms, zero drag-and-drop hell. Just chat with the AI and watch it appear. Create high-converting forms in minutes with AI-powered form generation.",
  url: siteUrl,
};

/**
 * Organization schema for the company/team
 */
export const organizationSchema: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Forms",
  description:
    "AI-powered form builder that helps you create beautiful, high-converting forms in minutes.",
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  sameAs: [
    // Add social media links here when available
    // "https://twitter.com/forms",
    // "https://github.com/forms",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "English",
  },
};

/**
 * Generate breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate SoftwareApplication schema for the form builder
 * Note: Only add aggregateRating if you have a real rating system
 */
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Forms - AI Form Builder",
  description:
    "AI-powered form builder that helps you create beautiful, high-converting forms in minutes using natural language.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
