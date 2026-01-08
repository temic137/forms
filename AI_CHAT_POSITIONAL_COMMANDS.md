# AI Inline Chat - Positional Field Commands Guide

## Quick Reference: Adding Fields at Specific Positions

The AI inline chat now supports adding fields at any position in your form, not just at the end!

### Command Patterns

#### 1. Add Below/After a Field
```
"Add an email field below question 2"
"Add a phone field after the 2nd question"
"Add a field after the name field"
```
→ Inserts the new field **immediately after** the specified field

#### 2. Add Above/Before a Field
```
"Add a name field above question 3"
"Add a field before the 3rd question"
"Add a description field before the email field"
```
→ Inserts the new field **immediately before** the specified field

#### 3. Add at Beginning
```
"Add a field at the top"
"Add a field at the beginning"
"Insert a heading at the start"
```
→ Inserts the new field as the **first field** in the form

#### 4. Add Between Fields
```
"Insert a phone field between questions 2 and 3"
"Add a divider between the name and email fields"
```
→ Inserts the new field **between** the two specified fields

#### 5. Add at End (Default)
```
"Add a field"
"Add another email field"
"Create a message textarea"
```
→ Adds the field to the **end** of the form (original behavior)

## How It Works

### Field References
You can refer to fields using:
- **Numbers**: "field 1", "question 2", "the 3rd field"
- **Labels**: "the name field", "email question"
- **Position**: "the first field", "the last question"
- **Selection**: "this field", "selected field" (refers to currently selected field)

### Position Keywords
- **Below/After/Under**: Adds after the referenced field (field keeps its number, new field gets next number)
  - Example: "below field 6" → Field 6 stays #6, new field becomes #7
- **Above/Before**: Adds before the referenced field (field moves down one position, new field takes its number)
  - Example: "above field 6" → Old field 6 becomes #7, new field becomes #6
- **Between**: Adds between two fields
- **At top/beginning/start**: Adds as first field
- **At bottom/end**: Adds as last field (or just omit position)

### Important: Understanding "Below" vs "Above"
When you say **"below field 6"** or **"under field 6"**:
- ✅ Field 6 **keeps** its position as #6
- ✅ New field is added as #7 (after field 6)
- ✅ Field 6 **does not** move

When you say **"above field 6"** or **"before field 6"**:
- ⚠️ Field 6 **moves** to position #7
- ✅ New field takes position #6
- ⚠️ Field 6 **does** move down

## Examples

### Example 1: Building a Contact Form
```
You: "Create a name field"
AI: ✓ Added "Name" field
    Form: [1. Name]

You: "Add an email field below it"
AI: ✓ Added "Email" field at position 2
    Form: [1. Name, 2. Email]

You: "Add a phone field after the email"
AI: ✓ Added "Phone" field at position 3
    Form: [1. Name, 2. Email, 3. Phone]

You: "Insert a heading above the name field"
AI: ✓ Added "Contact Information" heading at the beginning
    Form: [1. Contact Info, 2. Name, 3. Email, 4. Phone]
```

### Example 2: Reorganizing a Form
```
You: "Add a field at the top"
AI: ✓ Added field at the beginning

You: "Add another field before question 3"
AI: ✓ Added field at position 3

You: "Insert a divider between fields 2 and 3"
AI: ✓ Added "Divider" at position 3
```

### Example 3: Understanding "Under" Behavior
```
Initial Form:
[1. Name, 2. Email, 3. Phone, 4. Address, 5. City, 6. State]

You: "Add a zip code field under the 6th question"
AI: ✓ Added "Zip Code" field at position 7

Result:
[1. Name, 2. Email, 3. Phone, 4. Address, 5. City, 6. State, 7. Zip Code]
                                                     ↑ stays #6   ↑ new #7

✅ Field 6 (State) kept its position
✅ New field (Zip Code) added as #7
❌ Field 6 did NOT become #7
```

### Example 4: Understanding "Above" Behavior
```
Initial Form:
[1. Name, 2. Email, 3. Phone, 4. Address, 5. City, 6. State]

You: "Add a country field above the 6th question"
AI: ✓ Added "Country" field at position 6

Result:
[1. Name, 2. Email, 3. Phone, 4. Address, 5. City, 6. Country, 7. State]
                                                     ↑ new #6    ↑ moved to #7

✅ New field (Country) inserted at position 6
⚠️ Old field 6 (State) moved to position 7
```

## Tips for Best Results

1. **Be Specific**: Use field numbers or exact labels for precision
   - Good: "Add field below question 2"
   - Less precise: "Add field somewhere in the middle"

2. **Use Natural Language**: The AI understands conversational commands
   - "Put an email field after the name"
   - "I need a phone field below question 2"
   - "Can you add a heading at the top?"

3. **Combine with Other Commands**: You can add and modify in one command
   - "Add an email field below question 2 and make it required"
   - "Insert a divider after the 3rd field"

4. **Reference Fields Multiple Ways**:
   - By number: "field 2", "question 3"
   - By label: "the name field", "email question"
   - By position: "the first field", "the last one"

## Troubleshooting

### "Field was added to the wrong position"
- Make sure you're using clear field references (numbers or exact labels)
- **Important distinction**:
  - "below/after/under field 6" → Field 6 stays as #6, new field becomes #7
  - "above/before field 6" → Field 6 becomes #7, new field becomes #6
- If a field "moved" when you said "below/under", report it as a bug

### "AI didn't understand my position request"
- Try using clearer keywords: "below", "above", "after", "before"
- Use field numbers instead of labels if labels are ambiguous
- Break complex requests into simpler steps

### "Field was added to the end instead of specified position"
- The AI may not have recognized the positional intent
- Try rephrasing: Instead of "add a field near question 2", use "add a field below question 2"

## Need Help?
If the AI doesn't understand your positional command, try:
1. Using field numbers instead of labels
2. Simplifying the command to just the position
3. Using standard keywords: above, below, before, after
