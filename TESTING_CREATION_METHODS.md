# Test the Multiple Creation Methods

This document provides test examples for all the new creation methods.

## Prerequisites

```bash
# Ensure server is running
npm run dev
# Server at http://localhost:3000
```

## Test Files Provided

### 1. Sample CSV (`test-form.csv`)

```csv
label,type,required,placeholder,options
Full Name,text,true,John Doe,
Email Address,email,true,john@example.com,
Phone Number,tel,false,+1 (555) 123-4567,
Age,number,false,25,
Country,select,true,,"USA,UK,Canada,Australia,Germany"
Newsletter,checkbox,false,,"Yes, send me updates"
Comments,textarea,false,Your feedback here...,
```

### 2. Sample JSON (`test-form.json`)

```json
{
  "title": "Customer Feedback Form",
  "fields": [
    {
      "id": "customer_name",
      "label": "Customer Name",
      "type": "text",
      "required": false,
      "placeholder": "Optional"
    },
    {
      "id": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "your@email.com"
    },
    {
      "id": "rating",
      "label": "How would you rate our service?",
      "type": "radio",
      "required": true,
      "options": ["Excellent", "Good", "Average", "Poor", "Very Poor"]
    },
    {
      "id": "recommend",
      "label": "Would you recommend us to others?",
      "type": "radio",
      "required": true,
      "options": ["Yes", "No", "Maybe"]
    },
    {
      "id": "feedback",
      "label": "Additional Comments",
      "type": "textarea",
      "required": false,
      "placeholder": "Share your thoughts..."
    }
  ]
}
```

### 3. Sample Text File (`test-form.txt`)

```
Full Name
Email Address
Phone Number
Company Name
Job Title
How did you hear about us?
Message
```

## Manual Testing Steps

### Test 1: AI Prompt Generation

1. Navigate to `http://localhost:3000/create`
2. Select "AI Prompt"
3. Enter: "Create a contact form with name, email, phone, subject, and message fields"
4. Click "Generate Form with AI"
5. ✅ Should generate form and redirect to builder

### Test 2: Voice Input

1. Navigate to `http://localhost:3000/create`
2. Select "Voice Input"
3. Click microphone button (allow permissions)
4. Say: "I need a registration form with full name, email, password, and age"
5. Click "Generate Form"
6. ✅ Should generate form and redirect to builder

### Test 3: File Upload (CSV)

1. Create `test-form.csv` with content above
2. Navigate to `http://localhost:3000/create`
3. Select "File Upload"
4. Drag and drop `test-form.csv`
5. Click "Generate Form"
6. ✅ Should parse CSV and create form

### Test 4: JSON Import

1. Navigate to `http://localhost:3000/create`
2. Select "JSON Import"
3. Paste the JSON from above (or click "Use Example")
4. Click "Import & Generate Form"
5. ✅ Should validate and create form

### Test 5: Document Scanner

1. Create or find a form image/PDF
2. Navigate to `http://localhost:3000/create`
3. Select "Scan Document"
4. Upload image or PDF
5. Click "Scan & Generate"
6. ✅ Should extract text and generate form

## API Testing with cURL

### Test AI Generation

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Create a contact form with name, email, and message"
  }'
```

Expected response:
```json
{
  "title": "Contact Form",
  "fields": [
    {
      "id": "name",
      "label": "Name",
      "type": "text",
      "required": true
    },
    ...
  ]
}
```

### Test File Upload

```bash
# Create test CSV file
echo 'label,type,required
Name,text,true
Email,email,true
Message,textarea,true' > test.csv

# Upload file
curl -X POST http://localhost:3000/api/ai/import-file \
  -F "file=@test.csv"
```

### Test Document Scanner

```bash
# Upload an image
curl -X POST http://localhost:3000/api/ai/scan-form \
  -F "file=@form-image.jpg"
```

## PowerShell Testing (Windows)

### Test AI Generation

```powershell
$body = @{
    brief = "Create a registration form with name, email, and password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Test File Upload

```powershell
# Create test file
@"
label,type,required
Full Name,text,true
Email Address,email,true
"@ | Out-File -FilePath "test.csv" -Encoding utf8

# Upload
$form = @{
    file = Get-Item -Path "test.csv"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/import-file" `
    -Method Post `
    -Form $form
```

## Expected Results

### Success Indicators

- ✅ No console errors
- ✅ Form structure returned
- ✅ Fields have proper types
- ✅ Redirect to builder works
- ✅ Form saves to database
- ✅ Fields are editable in builder

### Error Handling

Test error cases:

1. **Invalid File Type**
   - Upload `.exe` file
   - Should show: "Invalid file type"

2. **File Too Large**
   - Upload >10MB file
   - Should show: "File size must be less than 10MB"

3. **Invalid JSON**
   - Paste `{invalid json}`
   - Should show: "Invalid JSON syntax"

4. **Empty Request**
   - Submit without input
   - Should show: "Please provide input"

## Performance Testing

### Measure Response Times

```javascript
// Browser Console
async function testPerformance() {
  const start = performance.now();
  
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      brief: 'Create a contact form' 
    })
  });
  
  const data = await response.json();
  const duration = performance.now() - start;
  
  console.log(`Response time: ${duration.toFixed(2)}ms`);
  console.log('Data:', data);
}

testPerformance();
```

Expected times:
- AI Generation: 2-5 seconds
- File Upload: 1-3 seconds
- JSON Import: <1 second
- Document Scan: 5-15 seconds

## Browser Compatibility Testing

Test in different browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (not supported)

Features to test:
- File upload drag & drop
- Voice input (Chrome/Edge only)
- JSON editor
- Form preview
- Responsive design

## Automated Testing

### Jest Test Suite

```typescript
// __tests__/api/import-file.test.ts
describe('File Import API', () => {
  it('should parse CSV file', async () => {
    const csvContent = 'label,type,required\nName,text,true';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'test.csv');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/ai/import-file', {
      method: 'POST',
      body: formData,
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.fields).toHaveLength(1);
    expect(data.fields[0].label).toBe('Name');
  });
});
```

## Load Testing

### Simple Load Test

```bash
# Install Apache Bench (if not installed)
# Windows: Download from Apache website
# Mac: brew install httpd

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 -p test.json -T application/json \
  http://localhost:3000/api/ai/generate
```

## Troubleshooting Tests

### If Tests Fail

1. **Check Environment Variables**
   ```bash
   # Ensure GROQ_API_KEY is set
   echo $env:GROQ_API_KEY  # PowerShell
   ```

2. **Check Database Connection**
   ```bash
   # Test Prisma connection
   npx prisma db push
   ```

3. **Check Port**
   ```bash
   # Ensure port 3000 is available
   netstat -ano | findstr :3000
   ```

4. **Check Logs**
   - Check terminal for errors
   - Check browser console
   - Check Network tab in DevTools

## Test Checklist

- [ ] AI Prompt works
- [ ] Voice Input works
- [ ] CSV upload works
- [ ] JSON upload works
- [ ] Text file upload works
- [ ] Image scan works (with mock OCR)
- [ ] PDF scan works (with mock OCR)
- [ ] Error handling works
- [ ] File validation works
- [ ] Size limits enforced
- [ ] Forms save to database
- [ ] Redirect to builder works
- [ ] All fields editable
- [ ] Mobile responsive
- [ ] Keyboard accessible

## Next Steps After Testing

1. ✅ All tests pass → Ready for deployment
2. ⚠️ Some tests fail → Debug and fix
3. 🚀 Deploy to production
4. 📊 Monitor usage and performance
5. 🔄 Iterate based on feedback

## Additional Resources

- API Documentation: See code comments
- Database Schema: Check `prisma/schema.prisma`
- Component Props: Check TypeScript interfaces
- Error Messages: Check component error states

---

**Testing Status:** Ready for testing!
**Last Updated:** November 2025
