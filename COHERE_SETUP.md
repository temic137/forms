# Cohere AI Integration Setup

Your form generator now supports Cohere's free AI models for improved form generation intelligence!

## Why Cohere?

Cohere offers excellent free-tier models that are particularly good at:
- **Structured JSON generation** - Perfect for form field generation
- **Natural language understanding** - Better interpretation of user requests
- **Consistent output** - More reliable form structure generation

## Setup Instructions

### 1. Get Your Cohere API Key

1. Go to [Cohere Dashboard](https://dashboard.cohere.com/)
2. Sign up for a free account (if you don't have one)
3. Navigate to [API Keys](https://dashboard.cohere.com/api-keys)
4. Create a new API key
5. Copy the API key

### 2. Add API Key to Environment Variables

Add your Cohere API key to your `.env.local` file:

```bash
COHERE_API_KEY=your_cohere_api_key_here
```

### 3. How It Works

The form generator now uses a **multi-provider AI system** with automatic fallback:

1. **Cohere** (Primary) - Tries first for structured JSON generation
2. **Gemini** (Fallback) - If Cohere is unavailable
3. **Together AI** (Fallback) - If Gemini is unavailable  
4. **Groq** (Fallback) - If all others are unavailable

This ensures your form generator always works, even if one provider has issues!

## Free Tier Limits

Cohere's free tier includes:
- **100 requests per minute**
- Access to Command R7B and other models
- Perfect for development and moderate usage

## Testing

Once you've added your API key, test the integration:

1. Go to your form generator
2. Try generating a form (e.g., "contact form with name, email, and message")
3. Check the console logs - you should see: `Form generated using cohere AI provider`

## Troubleshooting

### "COHERE_API_KEY not configured"
- Make sure you've added the key to `.env.local`
- Restart your development server after adding the key
- Check that the key name is exactly `COHERE_API_KEY`

### Cohere API errors
- Verify your API key is valid at [Cohere Dashboard](https://dashboard.cohere.com/api-keys)
- Check if you've exceeded rate limits (100 requests/min on free tier)
- The system will automatically fall back to other providers if Cohere fails

### Model not found errors
- The default model is `command-r7b-12-2024`
- If this model isn't available, the system will fall back to other providers
- You can specify a different model in the code if needed

## Benefits

✅ **Smarter form generation** - Better understanding of user intent  
✅ **More reliable JSON output** - Structured responses work better  
✅ **Automatic fallback** - Always works even if one provider fails  
✅ **Free tier available** - No cost for development and moderate usage  
✅ **Better field type inference** - More accurate form field suggestions

## Next Steps

- The integration is automatic - no code changes needed!
- Just add your API key and start generating smarter forms
- Monitor console logs to see which provider is being used

Enjoy smarter form generation! 🚀

