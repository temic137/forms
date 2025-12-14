import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google Sheets Integration Library
 * Handles OAuth, sheet creation, and data syncing
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  sheetName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | string | number | null;
}

export interface SheetRow {
  [key: string]: string | number | boolean;
}

/**
 * Helper to format range string with safe sheet name
 */
function getRange(sheetName: string, range: string): string {
  // If sheet name has spaces or special chars, wrap in single quotes
  // Also escape existing single quotes by doubling them
  if (sheetName.includes(' ') || /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]/.test(sheetName)) {
    const escapedName = sheetName.replace(/'/g, "''");
    return `'${escapedName}'!${range}`;
  }
  return `${sheetName}!${range}`;
}

/**
 * Get authenticated Google Sheets client
 */
async function getAuthenticatedClient(config: GoogleSheetsConfig): Promise<{ client: any; auth: OAuth2Client }> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  if (!config.accessToken && !config.refreshToken) {
    throw new Error("No authentication tokens found");
  }

  auth.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expiry_date: config.expiresAt ? new Date(config.expiresAt).getTime() : undefined,
  });

  // Check if token needs refresh
  const isExpired = config.expiresAt ? new Date(config.expiresAt).getTime() < Date.now() : true;
  
  // Note: googleapis handles refresh automatically if refresh_token is present
  // But we might want to capture the new token to save it (will be handled by the caller checking credentials)

  return {
    client: google.sheets({ version: "v4", auth }),
    auth
  };
}

/**
 * Add a row to a Google Sheet
 */
export async function addRowToSheet(
  config: GoogleSheetsConfig,
  data: SheetRow
): Promise<boolean> {
  try {
    if (!config.spreadsheetId) return false;

    const { client } = await getAuthenticatedClient(config);

    // Get the headers first to ensure we map data to correct columns
    const headerResponse = await client.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: getRange(config.sheetName, 'A1:Z1'), // Assume headers are in the first row
    });

    const headers = headerResponse.data.values?.[0] || [];
    
    if (headers.length === 0) {
      console.error("No headers found in sheet");
      return false;
    }

    // Map data to row based on headers
    const rowValues = headers.map((header: string) => {
      // Direct match
      if (data[header] !== undefined) return data[header];
      
      // Case insensitive match
      const key = Object.keys(data).find(k => k.toLowerCase() === header.toLowerCase());
      if (key && data[key] !== undefined) return data[key];
      
      return "";
    });

    await client.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: getRange(config.sheetName, 'A1'),
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error adding row to sheet:', error);
    return false;
  }
}

/**
 * Initialize sheet headers based on form fields
 */
export async function initializeSheetHeaders(
  config: GoogleSheetsConfig,
  headers: string[]
): Promise<boolean> {
  try {
    if (!config.spreadsheetId) return false;

    const { client } = await getAuthenticatedClient(config);

    // Check if headers already exist
    const checkResponse = await client.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: getRange(config.sheetName, 'A1:A1'),
    });

    if (checkResponse.data.values && checkResponse.data.values.length > 0) {
      // Sheet already has data/headers, don't overwrite
      return true;
    }

    // Write headers
    await client.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: getRange(config.sheetName, 'A1'),
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    });

    return true;
  } catch (error) {
    console.error('Error initializing headers:', error);
    return false;
  }
}

/**
 * Validate Google Sheets connection
 */
export async function validateGoogleSheetsConnection(
  config: GoogleSheetsConfig
): Promise<{ valid: boolean; error?: string; updatedConfig?: GoogleSheetsConfig }> {
  try {
    if (!config.spreadsheetId) {
       return { valid: false, error: "Spreadsheet ID is missing" };
    }

    const { client, auth } = await getAuthenticatedClient(config);

    // Try to access the spreadsheet
    await client.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
    });

    // Check if token was refreshed
    const credentials = auth.credentials;
    let updatedConfig: GoogleSheetsConfig | undefined;

    if (credentials.access_token && credentials.access_token !== config.accessToken) {
      updatedConfig = {
        ...config,
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        refreshToken: credentials.refresh_token || config.refreshToken, // Preserve refresh token if not returned
      };
    }

    return { valid: true, updatedConfig };
  } catch (error: any) {
    console.error('Invalid Google Sheets connection:', error);
    return { 
      valid: false, 
      error: error.message || 'Failed to validate Google Sheets connection' 
    };
  }
}

/**
 * Format submission data for Google Sheets
 */
export function formatSubmissionForSheet(
  submission: any,
  fields: Array<{ id: string; label: string; type: string }>
): SheetRow {
  const row: SheetRow = {
    'Submission ID': submission.id,
    'Submitted At': new Date(submission.createdAt).toLocaleString(),
  };

  fields.forEach(field => {
    // Handle different field types if needed
    const value = submission.answersJson[field.id];
    
    // Normalize field label to match sheet header
    // (We use the exact label as key)
    
    if (value === undefined || value === null) {
      row[field.label] = '';
    } else if (Array.isArray(value)) {
      row[field.label] = value.join(', ');
    } else if (typeof value === 'object') {
      row[field.label] = JSON.stringify(value);
    } else {
      row[field.label] = value;
    }
  });

  return row;
}

/**
 * Generate Google Sheets OAuth URL
 * In production, use this for proper OAuth flow
 */
export function getGoogleSheetsAuthUrl(redirectUri: string): string {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", 
  });
}
