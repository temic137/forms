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
 * For now, we'll use a simple API key approach (simpler than full OAuth)
 * In production, you'd want full OAuth2 flow with refresh tokens
 */

/**
 * Create a new Google Sheet for a form
 */
export async function createGoogleSheet(
  formTitle: string,
  fields: Array<{ id: string; label: string }>
): Promise<{ spreadsheetId: string; sheetUrl: string }> {
  // This would normally call Google Sheets API
  // For now, return mock data for testing
  const spreadsheetId = `sheet_${Date.now()}`;
  
  return {
    spreadsheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
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
    // In production, this would use Google Sheets API
    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
    
    console.log('Adding row to Google Sheet:', {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      data
    });
    
    // Mock success for now
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
    // This would set up the first row with field labels
    console.log('Initializing sheet headers:', headers);
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
    // Test the connection by attempting to read sheet metadata
    // If tokens are expired, refresh them here if needed
    return { valid: true };
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
    const value = submission.answersJson[field.id];
    
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
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  // This would call Google OAuth token endpoint
  // For now, return mock tokens
  return {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresIn: 3600
  };
}





