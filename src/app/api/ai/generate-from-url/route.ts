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
  return `You are an expert form designer that analyzes websites and creates forms that SERVE THE WEBSITE'S VISITORS.

CRITICAL UNDERSTANDING:
You are NOT creating a form about the website itself.
You are NOT creating a form asking users about their form preferences.
You ARE creating a form that the website owner would use to collect information from their visitors.

EXAMPLE OF WHAT NOT TO DO:
❌ "What is the primary purpose of your form?" - This asks about forms, not the website's service
❌ "What industry does your company operate in?" - Generic, not related to the website
❌ "Are you interested in integrating with [product]?" - Meta question about the product
❌ "What is your expected timeline for implementing?" - About implementation, not the service

EXAMPLE OF WHAT TO DO:
If the website is about "Xavier AI - an AI assistant service":
✅ Create a form that helps visitors GET IN TOUCH or REQUEST A DEMO of Xavier AI
✅ Ask about their USE CASE for AI, their COMPANY, their NEEDS
✅ Focus on what PROBLEMS they want Xavier AI to solve

WEBSITE TYPE → FORM PURPOSE:
- AI/Software product → Demo request, trial signup, or contact sales
- Agency/Services → Request a quote, book consultation
- Restaurant → Make a reservation
- E-commerce → Customer support, product inquiry
- Portfolio → Contact/hire me form
- Blog/Content → Newsletter signup, feedback
- SaaS → Free trial signup, pricing inquiry

JSON STRUCTURE (return ONLY this, no markdown):
{
  "title": "Form title that reflects the ACTION users take",
  "fields": [
    {
      "id": "snake_case_id",
      "label": "Clear question",
      "type": "text|email|textarea|number|date|select|radio|checkbox|tel|url",
      "required": true|false,
      "placeholder": "Helpful example",
      "helpText": "Why we ask this (optional)",
      "options": ["option1", "option2"]
    }
  ]
}`;
}

function buildURLUserPrompt(content: string): string {
  return `WEBSITE CONTENT:
${content}

YOUR TASK:
1. Identify what this website/company DOES or OFFERS
2. Create a form that helps VISITORS interact with that service
3. The form should collect information the website owner needs from potential customers/users

WRONG APPROACH:
- Don't ask users about "what type of form they want"
- Don't ask about "integration preferences" or "implementation timeline"
- Don't create a generic contact form if the website has a specific purpose

RIGHT APPROACH:
- If it's an AI product → ask about their AI needs, use cases, company info
- If it's a service → ask about their project, requirements, budget
- If it's e-commerce → ask about product questions, support needs
- Make the form RELEVANT to what the website actually offers

EXAMPLE - For an AI assistant website like "Xavier AI":
{
  "title": "Request a Demo of Xavier AI",
  "fields": [
    {"id": "name", "label": "Your Name", "type": "text", "required": true},
    {"id": "email", "label": "Work Email", "type": "email", "required": true},
    {"id": "company", "label": "Company Name", "type": "text", "required": true},
    {"id": "role", "label": "Your Role", "type": "select", "options": ["Executive", "Manager", "Developer", "Other"], "required": false},
    {"id": "use_case", "label": "What would you like to use Xavier AI for?", "type": "textarea", "placeholder": "e.g., Customer support automation, content generation, data analysis...", "required": true},
    {"id": "team_size", "label": "Team Size", "type": "select", "options": ["1-10", "11-50", "51-200", "200+"], "required": false},
    {"id": "current_tools", "label": "What tools do you currently use for this?", "type": "textarea", "required": false},
    {"id": "timeline", "label": "When are you looking to implement an AI solution?", "type": "radio", "options": ["Immediately", "1-3 months", "3-6 months", "Just exploring"], "required": true}
  ]
}

Now analyze the website content and create an appropriate form. Return ONLY valid JSON.`;
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




