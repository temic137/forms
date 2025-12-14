# Notion Integration Setup Guide

The Notion integration is **super simple** - no OAuth, no complex setup! Just an API key and database ID.

## Quick Setup (2-3 minutes)

### Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "My Forms App")
4. Select your workspace
5. Click **"Submit"**
6. **Copy the "Internal Integration Token"** - it may start with `secret_`, `ntn_`, or other prefixes
   - ⚠️ **Save this immediately** - you won't be able to see it again!

### Step 2: Share Your Database with the Integration

1. Open your Notion database (or create a new one)
2. Click the **"..."** menu in the top right
3. Click **"Add connections"** or **"Connections"**
4. Search for your integration name (e.g., "My Forms App")
5. Click to add it
6. The integration now has access to your database!

### Step 3: Get Your Database ID

**Option A: From URL**
- Open your Notion database
- Copy the URL from your browser
- It looks like: `https://www.notion.so/workspace/DatabaseName-abc123def456...`
- The ID is the 32-character string at the end (after the last `-`)

**Option B: Extract from URL**
- The integration will automatically extract the ID if you paste the full URL
- Just paste the entire Notion database URL

### Step 4: Connect in Your Form

1. Go to your form's dashboard
2. Click **"Integrations"**
3. Find the **Notion** section
4. Paste your **API Key** (your integration token)
5. Paste your **Database ID or URL**
6. Click **"Connect"**

**Done!** 🎉 Form submissions will now automatically create pages in your Notion database.

---

## How It Works

When a form is submitted:

1. A new page is created in your Notion database
2. Form fields are mapped to Notion properties:
   - **Text fields** → Notion "Title" or "Rich Text" properties
   - **Numbers** → Notion "Number" properties
   - **Checkboxes** → Notion "Checkbox" properties
   - **Dates** → Notion "Date" properties
   - **Select/Multi-select** → Notion "Select" or "Multi-select" properties
3. Submission metadata is added:
   - **Submission ID** - Unique identifier
   - **Submitted At** - Timestamp

---

## Database Setup Tips

### Recommended Database Properties

For best results, create these properties in your Notion database:

1. **Title** property (required) - Will store the submission ID or first field
2. **Rich Text** properties - For text fields, emails, URLs
3. **Number** properties - For numeric fields
4. **Date** properties - For date fields
5. **Checkbox** properties - For boolean/checkbox fields
6. **Select** properties - For single-choice fields
7. **Multi-select** properties - For multiple-choice fields

### Property Naming

- Property names in Notion should match your form field labels
- Example: If your form has a field labeled "Email", create a "Email" property in Notion
- The integration will automatically match fields by name (case-insensitive)

---

## Troubleshooting

### "Invalid API key" Error

**Solution:**
- Make sure you copied the entire token (may start with `secret_`, `ntn_`, or other prefixes)
- Check for extra spaces before/after the token
- Create a new integration if you lost the token

### "Database not found" Error

**Solution:**
- Make sure you shared the database with your integration
- Check that the database ID is correct (32 characters)
- Try pasting the full Notion URL instead of just the ID

### "Invalid property format" Error

**Solution:**
- Check that your Notion properties match the field types
- Text fields need "Title" or "Rich Text" properties
- Number fields need "Number" properties
- Make sure property names match form field labels

### Data Not Appearing

**Check:**
1. Is the integration enabled? (Check the dashboard)
2. Did you share the database with the integration?
3. Are there any errors in the server logs?
4. Try submitting a test form response

### Property Type Mismatches

If a field doesn't sync correctly:
- Check the property type in Notion matches the form field type
- Text → "Title" or "Rich Text"
- Numbers → "Number"
- Dates → "Date"
- Checkboxes → "Checkbox"

---

## Advanced: Field Mapping

The integration automatically matches form fields to Notion properties by name. If you need custom mapping:

1. Property names should match form field labels (case-insensitive)
2. If a property doesn't exist, the field will be skipped
3. If a property type doesn't match, it will try to convert or skip

---

## Security Best Practices

1. **Keep your API key secret** - Never share it publicly
2. **Use separate integrations** for different forms (optional)
3. **Limit database access** - Only share databases that need access
4. **Rotate keys** if they're ever exposed

---

## Example Database Structure

Here's a recommended database structure for form submissions:

| Property Name | Type | Description |
|--------------|------|-------------|
| Submission ID | Title | Unique submission identifier |
| Submitted At | Date | When the form was submitted |
| Name | Rich Text | User's name |
| Email | Email | User's email |
| Message | Rich Text | Form message/comment |
| Phone | Phone Number | User's phone (if collected) |
| Status | Select | Submission status (New, Reviewed, etc.) |

---

## Need Help?

If you're stuck:
1. Check the error message in the integration settings
2. Verify your API key is correct
3. Ensure the database is shared with the integration
4. Check server logs for detailed error messages
5. Make sure property types match field types

---

## Quick Checklist

- [ ] Created Notion integration
- [ ] Copied API key (starts with `secret_`)
- [ ] Created/shared Notion database
- [ ] Shared database with integration
- [ ] Copied database ID or URL
- [ ] Added API key to form integration
- [ ] Added database ID to form integration
- [ ] Tested with a form submission
- [ ] Verified data appears in Notion

That's it! Notion integration is much simpler than Google Sheets - no OAuth, no redirect URIs, just API key + database ID! 🚀

