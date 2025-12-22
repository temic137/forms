/**
 * Notion Integration Library
 * Handles database operations and data syncing
 */

import { Client } from '@notionhq/client';

export interface NotionConfig {
  apiKey: string;
  databaseId?: string; // Optional - will create one if not provided
}

export interface NotionPage {
  [key: string]: any;
}

/**
 * Get authenticated Notion client
 */
function getNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

/**
 * Create a new Notion database
 */
export async function createNotionDatabase(
  apiKey: string,
  formTitle: string
): Promise<{ databaseId: string; databaseUrl: string }> {
  try {
    const notion = getNotionClient(apiKey);

    // Get user's pages to find a parent page
    const pages = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      page_size: 1,
    });

    const parentPageId = pages.results[0]?.id;
    if (!parentPageId) {
      throw new Error('No pages found. Please create a page in Notion first.');
    }

    // Create database
    const database = await notion.databases.create({
      parent: {
        page_id: parentPageId,
      },
      title: [
        {
          text: {
            content: `${formTitle} Submissions`,
          },
        },
      ],
      properties: {
        'Submission ID': {
          title: {},
        },
        'Submitted At': {
          date: {},
        },
      },
    });

    return {
      databaseId: database.id,
      databaseUrl: (database as any).url || `https://notion.so/${database.id.replace(/-/g, '')}`,
    };
  } catch (error: any) {
    console.error('Error creating Notion database:', error);
    throw new Error(error.message || 'Failed to create Notion database');
  }
}

/**
 * Validate Notion connection and create database if needed
 */
export async function validateNotionConnection(
  config: NotionConfig,
  formTitle?: string
): Promise<{ valid: boolean; error?: string; databaseTitle?: string; databaseId?: string; databaseUrl?: string }> {
  try {
    const notion = getNotionClient(config.apiKey);

    // If no database ID, create one
    if (!config.databaseId) {
      if (!formTitle) {
        return { valid: false, error: 'Form title required to create database' };
      }
      const created = await createNotionDatabase(config.apiKey, formTitle);
      return {
        valid: true,
        databaseTitle: `${formTitle} Submissions`,
        databaseId: created.databaseId,
        databaseUrl: created.databaseUrl,
      };
    }

    // Try to get database info
    const database = await notion.databases.retrieve({
      database_id: config.databaseId,
    });

    return {
      valid: true,
      databaseTitle: (database as any).title?.[0]?.plain_text || 'Untitled Database',
      databaseId: config.databaseId,
    };
  } catch (error: any) {
    console.error('Invalid Notion connection:', error);

    if (error.code === 'unauthorized') {
      return { valid: false, error: 'Invalid API key. Please check your Notion integration token.' };
    } else if (error.code === 'object_not_found') {
      return { valid: false, error: 'Database not found. Leave database ID empty to create a new one automatically.' };
    } else if (error.message?.includes('API token')) {
      return { valid: false, error: 'Invalid API key format.' };
    }

    return { valid: false, error: error.message || 'Failed to validate Notion connection' };
  }
}

/**
 * Get database schema (properties)
 */
export async function getDatabaseSchema(
  config: NotionConfig
): Promise<{ [key: string]: { type: string; name: string } }> {
  try {
    if (!config.databaseId) {
      throw new Error('Database ID is required');
    }

    const notion = getNotionClient(config.apiKey);
    const database = await notion.databases.retrieve({
      database_id: config.databaseId,
    });

    const properties = (database as any).properties || {};
    const schema: { [key: string]: { type: string; name: string } } = {};

    Object.keys(properties).forEach((key) => {
      schema[key] = {
        type: properties[key].type,
        name: properties[key].name || key,
      };
    });

    return schema;
  } catch (error) {
    console.error('Error getting database schema:', error);
    return {};
  }
}

/**
 * Create a page in Notion database
 */
export async function createNotionPage(
  config: NotionConfig,
  properties: { [key: string]: any }
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    if (!config.databaseId) {
      return { success: false, error: 'Database ID is required' };
    }

    const notion = getNotionClient(config.apiKey);

    // Get database schema to map properties correctly
    const schema = await getDatabaseSchema(config);

    // Build properties object with correct types
    const notionProperties: { [key: string]: any } = {};

    Object.keys(properties).forEach((key) => {
      const value = properties[key];
      const schemaProp = schema[key];

      if (!schemaProp) {
        // Try to find by name (case-insensitive)
        const foundKey = Object.keys(schema).find(
          (k) => schema[k].name.toLowerCase() === key.toLowerCase()
        );
        if (foundKey) {
          const prop = schema[foundKey];
          notionProperties[foundKey] = formatPropertyForNotion(value, prop.type);
        }
        return;
      }

      notionProperties[key] = formatPropertyForNotion(value, schemaProp.type);
    });

    // Create the page
    const response = await notion.pages.create({
      parent: {
        database_id: config.databaseId,
      },
      properties: notionProperties,
    });



    return {
      success: true,
      pageId: response.id,
    };
  } catch (error: any) {
    console.error('Error creating Notion page:', error);

    if (error.code === 'unauthorized') {
      return { success: false, error: 'Invalid API key. Please reconnect your Notion integration.' };
    } else if (error.code === 'object_not_found') {
      return { success: false, error: 'Database not found. Please check the database ID.' };
    } else if (error.code === 'validation_error') {
      return { success: false, error: 'Invalid property format. Please check your database schema.' };
    }

    return { success: false, error: error.message || 'Failed to create Notion page' };
  }
}

/**
 * Format a value for Notion property based on type
 */
function formatPropertyForNotion(value: any, propertyType: string): any {
  if (value === null || value === undefined || value === '') {
    return getEmptyProperty(propertyType);
  }

  switch (propertyType) {
    case 'title':
      return {
        title: [{ text: { content: String(value) } }],
      };

    case 'rich_text':
      return {
        rich_text: [{ text: { content: String(value) } }],
      };

    case 'number':
      const num = parseFloat(String(value));
      return isNaN(num) ? getEmptyProperty(propertyType) : { number: num };

    case 'select':
      return {
        select: { name: String(value) },
      };

    case 'multi_select':
      const values = Array.isArray(value) ? value : [value];
      return {
        multi_select: values.map((v) => ({ name: String(v) })),
      };

    case 'date':
      try {
        const date = new Date(value);
        return {
          date: {
            start: date.toISOString().split('T')[0],
          },
        };
      } catch {
        return getEmptyProperty(propertyType);
      }

    case 'checkbox':
      return {
        checkbox: Boolean(value),
      };

    case 'url':
      return {
        url: String(value),
      };

    case 'email':
      return {
        email: String(value),
      };

    case 'phone_number':
      return {
        phone_number: String(value),
      };

    default:
      // Default to rich_text for unknown types
      return {
        rich_text: [{ text: { content: String(value) } }],
      };
  }
}

/**
 * Get empty property value for a type
 */
function getEmptyProperty(propertyType: string): any {
  switch (propertyType) {
    case 'title':
      return { title: [] };
    case 'rich_text':
      return { rich_text: [] };
    case 'number':
      return { number: null };
    case 'select':
      return { select: null };
    case 'multi_select':
      return { multi_select: [] };
    case 'date':
      return { date: null };
    case 'checkbox':
      return { checkbox: false };
    case 'url':
      return { url: null };
    case 'email':
      return { email: null };
    case 'phone_number':
      return { phone_number: null };
    default:
      return { rich_text: [] };
  }
}

/**
 * Format submission data for Notion
 */
export function formatSubmissionForNotion(
  submission: any,
  fields: Array<{ id: string; label: string; type: string }>,
  fieldMapping?: { [formFieldId: string]: string } // Maps form field IDs to Notion property names
): { [key: string]: any } {
  const properties: { [key: string]: any } = {};

  // Add submission metadata
  properties['Submission ID'] = submission.id;
  properties['Submitted At'] = new Date(submission.createdAt).toLocaleString();

  // Add form field values
  fields.forEach((field) => {
    const value = submission.answersJson[field.id];
    const notionPropertyName = fieldMapping?.[field.id] || field.label;

    if (value === undefined || value === null) {
      properties[notionPropertyName] = '';
    } else if (Array.isArray(value)) {
      properties[notionPropertyName] = value.join(', ');
    } else if (typeof value === 'object') {
      properties[notionPropertyName] = JSON.stringify(value);
    } else {
      properties[notionPropertyName] = value;
    }
  });

  return properties;
}

/**
 * Extract database ID from Notion URL
 */
export function extractDatabaseId(input: string): string {
  // Extract ID from URL or use as-is
  // Notion URLs look like: https://www.notion.so/workspace/DatabaseName-abc123def456...
  // Or: https://notion.so/abc123def456...

  // Try to extract from full URL
  const urlMatch = input.match(/notion\.so\/(?:[^/]+\/)?([a-zA-Z0-9]{32})/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try to extract 32-char hex ID
  const idMatch = input.match(/([a-f0-9]{32})/i);
  if (idMatch) {
    return idMatch[1];
  }

  // If it's already just an ID, return as-is
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

