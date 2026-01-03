# ✅ Embed Feature - Testing Checklist

## Pre-Testing Setup

### 1. Restart Development Server
```bash
# Stop any running servers (Ctrl+C)
# Then start fresh
npm run dev
```

### 2. Clear Browser Cache
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or use Incognito/Private window

---

## Testing Steps

### Step 1: Create a Test Form
- [ ] Go to `http://localhost:3000/dashboard`
- [ ] Create a new form with various field types:
  - [ ] Text field
  - [ ] Email field
  - [ ] Dropdown/Select
  - [ ] Radio buttons
  - [ ] Checkbox
  - [ ] Textarea
- [ ] Note the form ID from the URL (e.g., `/f/abc123xyz`)

### Step 2: Test Basic Embed
- [ ] Open `http://localhost:3000/test-embed.html`
- [ ] Replace `YOUR_FORM_ID` with your actual form ID
- [ ] Verify form loads and displays correctly
- [ ] Check that all fields are visible
- [ ] Verify styling looks good (colors, fonts, spacing)

### Step 3: Test Form Submission
- [ ] Fill out all required fields
- [ ] Click Submit button
- [ ] Verify "Submitting..." state appears
- [ ] Verify success message appears after submission
- [ ] Check browser console for any errors
- [ ] Go to dashboard → Forms → Submissions
- [ ] Verify the submission is recorded

### Step 4: Test Customization Options

#### Transparent Mode
```html
<iframe src="/embed/YOUR_FORM_ID?transparent=true" ...></iframe>
```
- [ ] Background is transparent
- [ ] Form blends with page

#### Hide Title
```html
<iframe src="/embed/YOUR_FORM_ID?hideTitle=true" ...></iframe>
```
- [ ] Form title is hidden

#### Hide Branding
```html
<iframe src="/embed/YOUR_FORM_ID?hideBranding=true" ...></iframe>
```
- [ ] "Powered by AnyForm" footer is hidden

#### Dark Theme
```html
<iframe src="/embed/YOUR_FORM_ID?theme=dark" ...></iframe>
```
- [ ] Form displays in dark theme

#### Combined Options
```html
<iframe src="/embed/YOUR_FORM_ID?transparent=true&hideTitle=true&theme=light" ...></iframe>
```
- [ ] Multiple options work together

### Step 5: Test Event Communication
- [ ] Open browser console
- [ ] Submit the form
- [ ] Check for console message: "✅ Form submitted successfully!"
- [ ] Verify alert appears with "Thank you for your submission!"

### Step 6: Test "Limit One Response" Feature
- [ ] Go to form settings
- [ ] Enable "Limit one response"
- [ ] Save the form
- [ ] Submit the embedded form
- [ ] Try to submit again
- [ ] Verify error message appears about already responding

### Step 7: Test Field Validation
- [ ] Leave required fields empty
- [ ] Try to submit
- [ ] Verify validation errors appear
- [ ] Fill fields with invalid data (e.g., bad email)
- [ ] Verify field-specific errors appear

### Step 8: Test on Different Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Step 9: Test Responsive Design
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Test on mobile sizes (375px, 414px)
- [ ] Test on tablet sizes (768px, 1024px)
- [ ] Verify form is readable and usable on all sizes

---

## Common Issues & Solutions

### Issue: Form doesn't load
**Solutions:**
- Verify form ID is correct
- Check that dev server is running on port 3000
- Clear browser cache
- Check browser console for errors

### Issue: Styling looks broken
**Solutions:**
- Hard refresh (Ctrl+Shift+R)
- Verify `globals.css` import is in layout.tsx
- Check if you're using the latest code

### Issue: Submit button does nothing
**Solutions:**
- Check browser console for errors
- Verify API endpoint is `/api/forms/${formId}/submit`
- Check network tab to see the request
- Ensure all required fields are filled

### Issue: Data not saving
**Solutions:**
- Check that field IDs (not labels) are being used
- Verify respondentId is included in submission
- Check database connection
- Look at server logs for errors

### Issue: Can't embed in iframe
**Solutions:**
- Verify headers in `next.config.ts`
- Check that path is `/embed/` not `/f/`
- Clear browser cache
- Check browser console for X-Frame-Options errors

---

## Advanced Testing

### Test with Real Website
1. Create a simple HTML file:
```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>My Website</h1>
  <iframe 
    src="http://localhost:3000/embed/YOUR_FORM_ID" 
    width="100%" 
    height="800"
    frameborder="0"
  ></iframe>
</body>
</html>
```
2. Open the file in browser
3. Test form submission

### Test Event Handling
```javascript
let submissionCount = 0;

window.addEventListener('message', function(event) {
  if (event.data.type === 'FORM_SUBMITTED') {
    submissionCount++;
    console.log(`Total submissions: ${submissionCount}`);
    
    // Do something after submission
    document.getElementById('form-container').innerHTML = 
      '<h2>Thank you! Form submitted.</h2>';
  }
});
```

---

## Verification Checklist

### Code Changes Verified
- [ ] `src/app/embed/[formId]/layout.tsx` imports globals.css
- [ ] `src/app/embed/[formId]/EmbedFormRenderer.tsx` uses field IDs
- [ ] API endpoint is `/api/forms/${formId}/submit`
- [ ] respondentId is tracked and sent
- [ ] `next.config.ts` has iframe headers
- [ ] No compilation errors

### Features Working
- [ ] Form loads correctly in iframe
- [ ] Styling is correct
- [ ] Form submission works
- [ ] Success message displays
- [ ] Data is saved to database
- [ ] Validation works
- [ ] All field types work
- [ ] Customization options work
- [ ] Event communication works
- [ ] Responsive design works

### Documentation Complete
- [ ] `docs/EMBED_FEATURE_GUIDE.md` exists
- [ ] `public/test-embed.html` exists
- [ ] `EMBED_FIX_SUMMARY.md` exists

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **Submissions recorded in database**  
✅ **Works on all major browsers**  
✅ **Responsive on mobile**  
✅ **Documentation is clear**

---

## Next Steps After Testing

1. **If all tests pass:**
   - Deploy to staging environment
   - Test on staging
   - Update user-facing documentation
   - Announce feature is fixed

2. **If issues found:**
   - Document the issue
   - Check error messages
   - Review the fix summary
   - Debug and retest

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# In another terminal, check for TypeScript errors
npx tsc --noEmit

# Build for production (optional)
npm run build
```

---

## Emergency Rollback

If critical issues are found:

1. Revert the changes:
```bash
git log --oneline  # Find commit before changes
git revert [commit-hash]
```

2. Or restore individual files from git:
```bash
git checkout HEAD^ src/app/embed/[formId]/EmbedFormRenderer.tsx
git checkout HEAD^ src/app/embed/[formId]/layout.tsx
git checkout HEAD^ next.config.ts
```

---

**Remember:** Test thoroughly in development before deploying to production!

**Status:** Ready for Testing  
**Date:** January 3, 2026
