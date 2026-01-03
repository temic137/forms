# 📋 Form Embed Feature - Complete Guide

## ✅ Fixed Issues

The following critical issues have been resolved to make the embed feature fully functional:

### 1. **Missing CSS Variables** ✅
**Problem:** Embedded forms had no styling because `globals.css` wasn't imported in the embed layout.  
**Fix:** Added `import "@/app/globals.css"` to `src/app/embed/[formId]/layout.tsx`

### 2. **Incorrect API Endpoint** ✅
**Problem:** EmbedFormRenderer was calling `/api/forms/submit` instead of `/api/forms/${formId}/submit`  
**Fix:** Updated the fetch URL to use the correct endpoint with formId parameter

### 3. **Wrong Field Keys** ✅
**Problem:** Form was using slugified labels as keys instead of field IDs, causing submission failures  
**Fix:** Changed from `slugify(field.label)` to `field.id` throughout the renderer

### 4. **Missing RespondentId Tracking** ✅
**Problem:** "Limit one response" feature didn't work in embedded forms  
**Fix:** Added localStorage-based respondentId generation and tracking

### 5. **iframe Security Headers** ✅
**Problem:** Forms couldn't be embedded due to X-Frame-Options restrictions  
**Fix:** Added proper headers in `next.config.ts` to allow embedding

---

## 🚀 How to Use the Embed Feature

### Basic Embedding

1. **Get the Embed Code:**
   - Open your form in the dashboard
   - Click the "Share" button
   - Click "Embed Code" tab
   - Copy the generated iframe code

2. **Paste into Your Website:**
   ```html
   <iframe 
     src="https://your-domain.com/embed/YOUR_FORM_ID" 
     width="100%" 
     height="800" 
     frameborder="0" 
     style="border: none; border-radius: 8px;"
   ></iframe>
   ```

### Customization Options

Add query parameters to customize the embed:

```html
<iframe 
  src="https://your-domain.com/embed/YOUR_FORM_ID?transparent=true&hideTitle=true&theme=light" 
  width="100%" 
  height="800"
></iframe>
```

#### Available Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `transparent` | boolean | false | Remove background for seamless integration |
| `hideTitle` | boolean | false | Hide the form title |
| `hideBranding` | boolean | false | Hide "Powered by AnyForm" footer |
| `theme` | string | auto | Set theme: `light`, `dark`, or `auto` |
| `padding` | number | 16 | Adjust padding in pixels |

### Examples

**Seamless Integration:**
```html
<iframe 
  src="/embed/abc123?transparent=true&hideTitle=true" 
  width="100%" 
  height="600"
  style="border: none;"
></iframe>
```

**Dark Theme:**
```html
<iframe 
  src="/embed/abc123?theme=dark" 
  width="100%" 
  height="800"
  style="border: none; border-radius: 12px;"
></iframe>
```

**Minimal Embed:**
```html
<iframe 
  src="/embed/abc123?transparent=true&hideTitle=true&hideBranding=true" 
  width="100%" 
  height="500"
  style="border: none;"
></iframe>
```

---

## 🔔 Event Communication (Optional)

Listen for form events in your parent page:

```javascript
window.addEventListener('message', function(event) {
  // IMPORTANT: Verify origin for security!
  if (event.origin !== 'https://your-domain.com') return;
  
  if (event.data.type === 'FORM_SUBMITTED') {
    console.log('Form submitted successfully!');
    // Redirect user, show thank you message, etc.
    window.location.href = '/thank-you';
  }
  
  if (event.data.type === 'FORM_SUBMISSION_ERROR') {
    console.error('Submission error:', event.data.error);
    alert('Error: ' + event.data.error);
  }
});
```

### Event Types:

- **FORM_SUBMITTED** - Fired when form is successfully submitted
  ```javascript
  {
    type: 'FORM_SUBMITTED',
    formId: 'abc123',
    success: true
  }
  ```

- **FORM_SUBMISSION_ERROR** - Fired when submission fails
  ```javascript
  {
    type: 'FORM_SUBMISSION_ERROR',
    formId: 'abc123',
    error: 'Error message here'
  }
  ```

---

## 🧪 Testing the Embed

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the test page:
   ```
   http://localhost:3000/test-embed.html
   ```

3. Replace `YOUR_FORM_ID` in the test page with an actual form ID

4. Test the following:
   - ✅ Form loads correctly
   - ✅ Styling appears properly
   - ✅ All field types work
   - ✅ Form validation works
   - ✅ Form submission succeeds
   - ✅ Success message displays
   - ✅ Customization options work

### Create a Test Form

```bash
# 1. Create a simple test form
# 2. Note the form ID from the URL (/f/YOUR_FORM_ID)
# 3. Use the embed URL: /embed/YOUR_FORM_ID
```

---

## 🔒 Security Considerations

### Content Security Policy

The embed routes have specific CSP headers:
- `X-Frame-Options: ALLOWALL`
- `Content-Security-Policy: frame-ancestors *`

These allow embedding from any domain. For production, consider restricting to specific domains.

### Origin Verification

When using event listeners, always verify the event origin:

```javascript
window.addEventListener('message', function(event) {
  // Only accept messages from your domain
  if (event.origin !== 'https://your-production-domain.com') {
    return; // Ignore messages from other origins
  }
  
  // Process the event
});
```

### HTTPS Requirement

For production embeds, both the parent site and the iframe should use HTTPS.

---

## 📱 Responsive Design

The embed automatically adapts to mobile devices. Recommended settings:

```html
<!-- Full width on all devices -->
<iframe 
  src="/embed/YOUR_FORM_ID" 
  width="100%" 
  height="800"
  style="border: none; max-width: 100%;"
></iframe>
```

```css
/* Make iframe responsive */
.form-embed-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.form-embed-container iframe {
  width: 100%;
  height: 800px;
  border: none;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .form-embed-container iframe {
    height: 900px; /* More height on mobile */
  }
}
```

---

## 🐛 Troubleshooting

### Form doesn't load
- Verify the form ID is correct
- Check that the form is published (not deleted)
- Ensure your server is running
- Check browser console for errors

### Styling looks wrong
- Make sure you're using the latest version with the CSS import fix
- Clear browser cache
- Check if custom styling is being overridden by parent page CSS

### Form submission fails
- Check browser console for API errors
- Verify the API endpoint is accessible
- Check that all required fields are filled
- Look for CORS issues if embedding cross-domain

### "Limit one response" not working
- Clear localStorage: `localStorage.clear()`
- Check that the feature is enabled in form settings
- Verify respondentId is being sent (check Network tab)

### iframe shows "This page cannot be displayed"
- Check the headers configuration in `next.config.ts`
- Verify X-Frame-Options is set correctly
- Check CSP headers

---

## 💡 Best Practices

1. **Always test locally first** before deploying to production
2. **Use meaningful form IDs** for easier management
3. **Set appropriate iframe height** based on form length
4. **Handle events** to improve user experience
5. **Verify origins** for security when using event listeners
6. **Use HTTPS** in production
7. **Test on mobile** devices
8. **Consider accessibility** - ensure forms are keyboard navigable
9. **Monitor submissions** to catch issues early
10. **Update embed codes** when making significant form changes

---

## 📊 Features Supported in Embed

✅ All field types (text, email, select, radio, checkbox, etc.)  
✅ Multi-step forms (rendered as single page in embed)  
✅ Conditional logic  
✅ Field validation  
✅ Custom styling  
✅ Quiz mode  
✅ File uploads  
✅ Star ratings  
✅ Limit one response  
✅ Form scheduling (open/close dates)  
✅ Success messages  
✅ Error handling  
✅ Responsive design  
✅ Dark/light themes  
✅ Custom fonts  

⚠️ **Note:** Multi-step forms are rendered as a single scrollable page in embed mode for better iframe compatibility.

---

## 🔄 Recent Updates

- **Fixed**: CSS variables now properly load in embed
- **Fixed**: API endpoint corrected to match backend routes
- **Fixed**: Field keys use field IDs instead of slugified labels
- **Added**: RespondentId tracking for limit one response
- **Added**: Proper iframe security headers
- **Added**: Event communication with parent window
- **Added**: Test HTML page for easy testing

---

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review browser console for errors
3. Test with the provided test-embed.html file
4. Verify all fixes are applied (check file dates)
5. Clear cache and test again

---

**Last Updated:** January 3, 2026  
**Version:** 2.0 (Fully Functional)
