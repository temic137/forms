# 🚀 Embed Quick Reference

## Copy-Paste Ready Code

### Basic Embed
```html
<iframe 
  src="https://your-domain.com/embed/FORM_ID_HERE" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 8px;"
></iframe>
```

### Seamless Integration (No Background)
```html
<iframe 
  src="https://your-domain.com/embed/FORM_ID_HERE?transparent=true&hideTitle=true" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none;"
></iframe>
```

### Dark Mode
```html
<iframe 
  src="https://your-domain.com/embed/FORM_ID_HERE?theme=dark" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 8px; background: #1a1a1a;"
></iframe>
```

### Minimal (No Branding)
```html
<iframe 
  src="https://your-domain.com/embed/FORM_ID_HERE?transparent=true&hideBranding=true" 
  width="100%" 
  height="700" 
  frameborder="0" 
  style="border: none;"
></iframe>
```

### Full Customization
```html
<iframe 
  src="https://your-domain.com/embed/FORM_ID_HERE?transparent=true&hideTitle=true&hideBranding=true&theme=light&padding=24" 
  width="100%" 
  height="650" 
  frameborder="0" 
  style="border: none;"
></iframe>
```

---

## Parameters Reference

| Parameter | Values | Example |
|-----------|--------|---------|
| `transparent` | true/false | `?transparent=true` |
| `hideTitle` | true/false | `?hideTitle=true` |
| `hideBranding` | true/false | `?hideBranding=true` |
| `theme` | light/dark/auto | `?theme=dark` |
| `padding` | number (px) | `?padding=20` |

**Combine multiple:** `?transparent=true&hideTitle=true&theme=dark`

---

## CSS Wrapper (Responsive)

```html
<div class="form-embed">
  <iframe 
    src="https://your-domain.com/embed/FORM_ID_HERE" 
    frameborder="0"
  ></iframe>
</div>

<style>
.form-embed {
  max-width: 800px;
  margin: 0 auto;
}
.form-embed iframe {
  width: 100%;
  height: 800px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
@media (max-width: 768px) {
  .form-embed iframe {
    height: 900px;
  }
}
</style>
```

---

## JavaScript Event Handler

```html
<script>
window.addEventListener('message', function(event) {
  // Verify origin in production!
  // if (event.origin !== 'https://your-domain.com') return;
  
  if (event.data.type === 'FORM_SUBMITTED') {
    // Form submitted successfully
    console.log('✅ Success!');
    // Redirect or show message
    window.location.href = '/thank-you';
  }
  
  if (event.data.type === 'FORM_SUBMISSION_ERROR') {
    // Handle error
    console.error('❌ Error:', event.data.error);
    alert('Error: ' + event.data.error);
  }
});
</script>
```

---

## Common Scenarios

### Landing Page
```html
<section class="hero">
  <h1>Sign Up Today</h1>
  <div style="max-width: 600px; margin: 40px auto;">
    <iframe 
      src="/embed/signup-form?transparent=true&hideTitle=true" 
      width="100%" 
      height="500"
      style="border: none;"
    ></iframe>
  </div>
</section>
```

### Sidebar Widget
```html
<aside class="sidebar">
  <h3>Quick Survey</h3>
  <iframe 
    src="/embed/survey-form?transparent=true&padding=0" 
    width="100%" 
    height="400"
    style="border: none;"
  ></iframe>
</aside>
```

### Modal/Popup
```html
<div id="modal" style="display: none;">
  <div class="modal-content">
    <span class="close">×</span>
    <iframe 
      src="/embed/contact-form?transparent=true" 
      width="100%" 
      height="600"
      style="border: none;"
    ></iframe>
  </div>
</div>
```

### Full Page
```html
<html>
<head><title>Contact Us</title></head>
<body style="margin: 0; padding: 0;">
  <iframe 
    src="/embed/contact-form?transparent=true&padding=40" 
    width="100%" 
    height="100vh"
    style="border: none;"
  ></iframe>
</body>
</html>
```

---

## WordPress Shortcode

```php
// Add to functions.php
function anyform_embed_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'height' => '800',
        'transparent' => 'false',
    ), $atts);
    
    $url = "https://your-domain.com/embed/{$atts['id']}";
    if ($atts['transparent'] === 'true') {
        $url .= '?transparent=true';
    }
    
    return '<iframe src="' . esc_url($url) . '" width="100%" height="' . esc_attr($atts['height']) . '" frameborder="0" style="border: none; border-radius: 8px;"></iframe>';
}
add_shortcode('anyform', 'anyform_embed_shortcode');

// Usage in WordPress:
// [anyform id="abc123xyz" height="600" transparent="true"]
```

---

## React Component

```jsx
function FormEmbed({ formId, transparent = false, height = 800 }) {
  const params = new URLSearchParams();
  if (transparent) params.set('transparent', 'true');
  
  const src = `https://your-domain.com/embed/${formId}${
    params.toString() ? '?' + params.toString() : ''
  }`;
  
  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      frameBorder="0"
      style={{ border: 'none', borderRadius: '8px' }}
      title="Embedded Form"
    />
  );
}

// Usage:
<FormEmbed formId="abc123xyz" transparent={true} height={600} />
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Form not loading | Check form ID is correct |
| No styling | Clear cache, verify globals.css import |
| Can't submit | Check browser console for errors |
| Blocked by browser | Verify iframe headers in next.config.ts |
| Wrong data saved | Ensure using field IDs not labels |

---

## Testing URLs

- **Local Dev:** `http://localhost:3000/embed/YOUR_FORM_ID`
- **Test Page:** `http://localhost:3000/test-embed.html`
- **Production:** `https://your-domain.com/embed/YOUR_FORM_ID`

---

**Quick Start:**
1. Get form ID from dashboard
2. Copy embed code from this page
3. Replace `FORM_ID_HERE` with your ID
4. Paste into your website
5. Test and customize!

---

**Need Help?** Check `docs/EMBED_FEATURE_GUIDE.md` for full documentation.
