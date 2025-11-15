import { NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";

export const runtime = "nodejs";

type Field = {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "number" | "date" | "select" | "radio" | "checkbox" | "tel" | "url";
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
};

// Function to scrape content from URL
async function scrapeWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    // Extract main content (simplified approach - look for common content containers)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Remove scripts and styles
    let cleanContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Limit content length to prevent token limits
    if (cleanContent.length > 8000) {
      cleanContent = cleanContent.substring(0, 8000) + '...';
    }

    return `Title: ${title}\nDescription: ${metaDescription}\nContent: ${cleanContent}`;
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced prompt for URL-based form generation
function buildURLSystemPrompt(): string {
  return `You are an expert form designer that can analyze website content and create intelligent forms based on the context and purpose of the website.

CRITICAL RULES:
1. Analyze the website content to understand its PURPOSE and what kind of form would be most appropriate
2. Return ONLY valid JSON with no additional text or markdown
3. Extract relevant information from the content to inform field selection
4. Consider the website's audience and context when designing the form

JSON STRUCTURE:
{
  "title": "Form title based on website content and purpose",
  "fields": [
    {
      "id": "semantic_snake_case_id",
      "label": "User-friendly label",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url",
      "required": true|false,
      "placeholder": "Helpful placeholder text (optional)",
      "options": ["option1", "option2"] // Only for select/radio/checkbox types,
      "validation": {
        "min": number,
        "max": number,
        "pattern": "regex",
        "minLength": number,
        "maxLength": number
      }
    }
  ]
}

WEBSITE ANALYSIS INTELLIGENCE:
- **Business/Contact pages**: Contact forms (name, email, phone, message)
- **Product pages**: Inquiry forms, demo requests, quote requests
- **Service pages**: Consultation forms, booking forms, service requests
- **Event pages**: Registration forms, RSVP forms
- **Educational pages**: Enrollment forms, information request forms
- **E-commerce**: Customer inquiry forms, support forms

CONTENT-BASED FIELD SELECTION:
- If content mentions "contact us" → contact form
- If content mentions "book", "reserve", "schedule" → booking form
- If content mentions "subscribe", "newsletter" → subscription form
- If content mentions "apply", "application" → application form
- If content mentions "feedback", "review" → feedback form

SMART FORM DESIGN PRINCIPLES:
1. **Context-appropriate fields**: Only include fields relevant to the website's purpose
2. **Progressive disclosure**: Start with essential fields, add optional ones
3. **Website-aware placeholders**: Use examples from the website content
4. **Purpose-driven validation**: Apply appropriate validation based on form type
5. **Clear call-to-action**: Form title should reflect the website's purpose

EXAMPLES:

Website about "Photography Services":
- Title: "Book a Photography Session"
- Fields: name, email, phone, service type (dropdown), preferred date, special requests

Website about "Software Company":
- Title: "Contact Our Sales Team"
- Fields: name, email, company, message about their needs

Website about "Restaurant":
- Title: "Make a Reservation"
- Fields: name, phone, email, party size, preferred date/time, special requests

Remember: The form should serve the website's purpose and feel natural for that context.`;
}

function buildURLUserPrompt(content: string): string {
  return `Analyze this website content and create an appropriate form:

WEBSITE CONTENT:
${content}

Based on the website's content, purpose, and target audience:

1. What is the PRIMARY PURPOSE of this website?
2. What type of user interaction would be most valuable?
3. What information should the form collect?
4. What would be an appropriate form title?

Generate a complete, professional form JSON that fits the website's context and purpose.`;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Scrape website content
    const scrapedContent = await scrapeWebsiteContent(url);

    if (!scrapedContent || scrapedContent.trim().length < 50) {
      return NextResponse.json({ error: "Unable to extract meaningful content from the website" }, { status: 400 });
    }

    // Use AI to generate form based on scraped content
    const aiResponse = await getAICompletion({
      messages: [
        {
          role: "system",
          content: buildURLSystemPrompt(),
        },
        {
          role: "user",
          content: buildURLUserPrompt(scrapedContent),
        },
      ],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: "json",
    });

    const content = aiResponse.content || "{}";
    console.log(`Form generated from URL using ${aiResponse.provider} AI provider`);
    const data = JSON.parse(content) as { title: string; fields: Field[] };

    // Validate response structure
    if (!data?.title || !Array.isArray(data.fields) || data.fields.length === 0) {
      return NextResponse.json({ error: "AI generated invalid form structure" }, { status: 502 });
    }

    // Post-process fields to ensure quality
    const processedFields = data.fields.map((field, index) => ({
      ...field,
      id: field.id || `field_${index}`,
      label: field.label || "Field",
      type: field.type || "text",
      required: field.required ?? false,
      // Ensure options exist for choice fields
      options: (field.type === "select" || field.type === "radio" || field.type === "checkbox")
        ? (field.options || ["Option 1", "Option 2", "Option 3"])
        : undefined,
    }));

    return NextResponse.json({
      title: data.title,
      fields: processedFields,
    });
  } catch (err) {
    const error = err as Error;
    console.error("URL form generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate form from URL" },
      { status: 500 }
    );
  }
}
