import { Field, MultiStepConfig } from "@/types/form";

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  fields: Field[];
  multiStep?: MultiStepConfig;
}

export const templates: Template[] = [
  {
    id: "contact-form",
    name: "Contact Form",
    category: "General",
    description: "Simple contact form with name, email, and message fields",
    icon: "📧",
    fields: [
      {
        id: "name",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "John Doe",
        helpText: "Please enter your full name",
        order: 0,
        validation: [
          {
            type: "minLength",
            value: 2,
            message: "Name must be at least 2 characters",
          },
        ],
      },
      {
        id: "email",
        label: "Email Address",
        type: "email",
        required: true,
        placeholder: "john@example.com",
        helpText: "We'll never share your email with anyone else",
        order: 1,
        validation: [
          {
            type: "pattern",
            value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            message: "Please enter a valid email address",
          },
        ],
      },
      {
        id: "subject",
        label: "Subject",
        type: "text",
        required: true,
        placeholder: "How can we help?",
        order: 2,
      },
      {
        id: "message",
        label: "Message",
        type: "textarea",
        required: true,
        placeholder: "Tell us more about your inquiry...",
        helpText: "Please provide as much detail as possible",
        order: 3,
        validation: [
          {
            type: "minLength",
            value: 10,
            message: "Message must be at least 10 characters",
          },
        ],
      },
    ],
  },
  {
    id: "survey",
    name: "Survey",
    category: "Feedback",
    description: "Customer satisfaction survey with rating and feedback questions",
    icon: "📊",
    fields: [
      {
        id: "satisfaction",
        label: "How satisfied are you with our service?",
        type: "radio",
        required: true,
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        order: 0,
      },
      {
        id: "rating",
        label: "Rate your experience (1-10)",
        type: "number",
        required: true,
        placeholder: "5",
        helpText: "1 = Poor, 10 = Excellent",
        order: 1,
        validation: [
          {
            type: "min",
            value: 1,
            message: "Rating must be at least 1",
          },
          {
            type: "max",
            value: 10,
            message: "Rating cannot exceed 10",
          },
        ],
      },
      {
        id: "features",
        label: "Which features do you use most?",
        type: "checkbox",
        required: false,
        options: ["Dashboard", "Reports", "Analytics", "Integrations", "Mobile App"],
        order: 2,
      },
      {
        id: "improvements",
        label: "What could we improve?",
        type: "textarea",
        required: false,
        placeholder: "Share your suggestions...",
        order: 3,
      },
      {
        id: "recommend",
        label: "Would you recommend us to others?",
        type: "radio",
        required: true,
        options: ["Definitely", "Probably", "Not Sure", "Probably Not", "Definitely Not"],
        order: 4,
      },
    ],
  },
  {
    id: "registration",
    name: "Registration Form",
    category: "User Management",
    description: "User registration with personal info, password, and terms acceptance",
    icon: "👤",
    fields: [
      {
        id: "firstName",
        label: "First Name",
        type: "text",
        required: true,
        placeholder: "John",
        order: 0,
        stepId: "personal-info",
      },
      {
        id: "lastName",
        label: "Last Name",
        type: "text",
        required: true,
        placeholder: "Doe",
        order: 1,
        stepId: "personal-info",
      },
      {
        id: "email",
        label: "Email Address",
        type: "email",
        required: true,
        placeholder: "john@example.com",
        order: 2,
        stepId: "personal-info",
        validation: [
          {
            type: "pattern",
            value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            message: "Please enter a valid email address",
          },
        ],
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "text",
        required: false,
        placeholder: "+1 (555) 123-4567",
        helpText: "Optional - for account recovery",
        order: 3,
        stepId: "personal-info",
      },
      {
        id: "password",
        label: "Password",
        type: "text",
        required: true,
        placeholder: "Enter a strong password",
        helpText: "Must be at least 8 characters with letters and numbers",
        order: 4,
        stepId: "account-security",
        validation: [
          {
            type: "minLength",
            value: 8,
            message: "Password must be at least 8 characters",
          },
          {
            type: "pattern",
            value: "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message: "Password must contain both letters and numbers",
          },
        ],
      },
      {
        id: "confirmPassword",
        label: "Confirm Password",
        type: "text",
        required: true,
        placeholder: "Re-enter your password",
        order: 5,
        stepId: "account-security",
      },
      {
        id: "terms",
        label: "I agree to the Terms of Service and Privacy Policy",
        type: "checkbox",
        required: true,
        order: 6,
        stepId: "account-security",
      },
      {
        id: "newsletter",
        label: "Subscribe to newsletter for updates and offers",
        type: "checkbox",
        required: false,
        order: 7,
        stepId: "account-security",
      },
    ],
    multiStep: {
      enabled: true,
      steps: [
        {
          id: "personal-info",
          title: "Personal Information",
          description: "Tell us about yourself",
          order: 0,
          fieldIds: ["firstName", "lastName", "email", "phone"],
        },
        {
          id: "account-security",
          title: "Account Security",
          description: "Set up your account credentials",
          order: 1,
          fieldIds: ["password", "confirmPassword", "terms", "newsletter"],
        },
      ],
      showProgressBar: true,
      allowBackNavigation: true,
    },
  },
  {
    id: "feedback",
    name: "Feedback Form",
    category: "Feedback",
    description: "Collect detailed feedback with ratings and categorized comments",
    icon: "💬",
    fields: [
      {
        id: "overallRating",
        label: "Overall Rating",
        type: "radio",
        required: true,
        options: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
        order: 0,
      },
      {
        id: "category",
        label: "Feedback Category",
        type: "select",
        required: true,
        options: ["Product Quality", "Customer Service", "Pricing", "Website Experience", "Delivery", "Other"],
        order: 1,
      },
      {
        id: "specificIssue",
        label: "What specifically would you like to address?",
        type: "text",
        required: true,
        placeholder: "Brief description",
        order: 2,
      },
      {
        id: "details",
        label: "Please provide more details",
        type: "textarea",
        required: true,
        placeholder: "Share your experience in detail...",
        helpText: "The more details you provide, the better we can help",
        order: 3,
        validation: [
          {
            type: "minLength",
            value: 20,
            message: "Please provide at least 20 characters of detail",
          },
        ],
      },
      {
        id: "contactBack",
        label: "May we contact you about this feedback?",
        type: "radio",
        required: true,
        options: ["Yes, please contact me", "No, this is anonymous feedback"],
        order: 4,
      },
      {
        id: "contactEmail",
        label: "Contact Email",
        type: "email",
        required: false,
        placeholder: "your@email.com",
        helpText: "Only if you selected 'Yes' above",
        order: 5,
        conditionalLogic: [
          {
            id: "show-email-if-contact",
            sourceFieldId: "contactBack",
            operator: "equals",
            value: "Yes, please contact me",
            action: "show",
          },
        ],
      },
    ],
  },
  {
    id: "order-form",
    name: "Order Form",
    category: "E-commerce",
    description: "Product order form with selection, quantity, and shipping details",
    icon: "🛒",
    fields: [
      {
        id: "product",
        label: "Select Product",
        type: "select",
        required: true,
        options: ["Basic Plan - $9.99", "Pro Plan - $29.99", "Enterprise Plan - $99.99"],
        order: 0,
        stepId: "product-selection",
      },
      {
        id: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        placeholder: "1",
        order: 1,
        stepId: "product-selection",
        validation: [
          {
            type: "min",
            value: 1,
            message: "Quantity must be at least 1",
          },
          {
            type: "max",
            value: 100,
            message: "Maximum quantity is 100",
          },
        ],
      },
      {
        id: "addons",
        label: "Additional Add-ons",
        type: "checkbox",
        required: false,
        options: ["Priority Support (+$10)", "Extended Storage (+$5)", "Custom Branding (+$15)"],
        order: 2,
        stepId: "product-selection",
      },
      {
        id: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "John Doe",
        order: 3,
        stepId: "shipping-info",
      },
      {
        id: "shippingAddress",
        label: "Shipping Address",
        type: "textarea",
        required: true,
        placeholder: "123 Main St, Apt 4B\nCity, State ZIP",
        order: 4,
        stepId: "shipping-info",
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "text",
        required: true,
        placeholder: "+1 (555) 123-4567",
        helpText: "For delivery notifications",
        order: 5,
        stepId: "shipping-info",
      },
      {
        id: "specialInstructions",
        label: "Special Delivery Instructions",
        type: "textarea",
        required: false,
        placeholder: "Leave at front door, ring doorbell, etc.",
        order: 6,
        stepId: "shipping-info",
      },
    ],
    multiStep: {
      enabled: true,
      steps: [
        {
          id: "product-selection",
          title: "Product Selection",
          description: "Choose your products",
          order: 0,
          fieldIds: ["product", "quantity", "addons"],
        },
        {
          id: "shipping-info",
          title: "Shipping Information",
          description: "Where should we deliver?",
          order: 1,
          fieldIds: ["fullName", "shippingAddress", "phone", "specialInstructions"],
        },
      ],
      showProgressBar: true,
      allowBackNavigation: true,
    },
  },
  {
    id: "event-rsvp",
    name: "Event RSVP",
    category: "Events",
    description: "Event registration with attendance confirmation and guest details",
    icon: "🎉",
    fields: [
      {
        id: "name",
        label: "Your Name",
        type: "text",
        required: true,
        placeholder: "John Doe",
        order: 0,
      },
      {
        id: "email",
        label: "Email Address",
        type: "email",
        required: true,
        placeholder: "john@example.com",
        helpText: "We'll send event details to this email",
        order: 1,
        validation: [
          {
            type: "pattern",
            value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            message: "Please enter a valid email address",
          },
        ],
      },
      {
        id: "attendance",
        label: "Will you be attending?",
        type: "radio",
        required: true,
        options: ["Yes, I'll be there!", "No, I can't make it", "Maybe"],
        order: 2,
      },
      {
        id: "guestCount",
        label: "Number of Guests (including yourself)",
        type: "number",
        required: true,
        placeholder: "1",
        order: 3,
        validation: [
          {
            type: "min",
            value: 1,
            message: "Must be at least 1",
          },
          {
            type: "max",
            value: 10,
            message: "Maximum 10 guests per RSVP",
          },
        ],
        conditionalLogic: [
          {
            id: "show-guests-if-attending",
            sourceFieldId: "attendance",
            operator: "equals",
            value: "Yes, I'll be there!",
            action: "show",
          },
        ],
      },
      {
        id: "dietaryRestrictions",
        label: "Dietary Restrictions or Allergies",
        type: "textarea",
        required: false,
        placeholder: "Vegetarian, gluten-free, nut allergy, etc.",
        helpText: "Please list any dietary needs for you and your guests",
        order: 4,
        conditionalLogic: [
          {
            id: "show-dietary-if-attending",
            sourceFieldId: "attendance",
            operator: "equals",
            value: "Yes, I'll be there!",
            action: "show",
          },
        ],
      },
      {
        id: "specialRequests",
        label: "Special Requests or Accommodations",
        type: "textarea",
        required: false,
        placeholder: "Wheelchair access, parking needs, etc.",
        order: 5,
        conditionalLogic: [
          {
            id: "show-requests-if-attending",
            sourceFieldId: "attendance",
            operator: "equals",
            value: "Yes, I'll be there!",
            action: "show",
          },
        ],
      },
      {
        id: "comments",
        label: "Additional Comments",
        type: "textarea",
        required: false,
        placeholder: "Any other information you'd like to share...",
        order: 6,
      },
    ],
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter((template) => template.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set(templates.map((template) => template.category));
  return Array.from(categories);
}

/**
 * Apply a template to create a new form configuration
 * This function ensures all fields have proper IDs, ordering, and configurations
 * while preserving the ability to customize everything after application
 */
export interface AppliedTemplate {
  title: string;
  fields: Field[];
  multiStepConfig?: MultiStepConfig;
}

export function applyTemplate(template: Template): AppliedTemplate {
  // Generate unique IDs for all fields to avoid conflicts
  const timestamp = Date.now();
  
  // Deep clone and normalize all fields with unique IDs
  const normalizedFields: Field[] = template.fields.map((field, index) => {
    // Generate a unique ID based on timestamp and index
    const uniqueId = `${field.id}_${timestamp}_${index}`;
    
    // Deep clone the field to ensure no reference issues
    const normalizedField: Field = {
      ...field,
      id: uniqueId,
      order: index,
      // Ensure all optional arrays are properly initialized
      options: field.options ? [...field.options] : undefined,
      validation: field.validation 
        ? field.validation.map(rule => ({ ...rule }))
        : undefined,
      conditionalLogic: field.conditionalLogic
        ? field.conditionalLogic.map(rule => ({
            ...rule,
            id: `cond_${timestamp}_${index}_${Math.random().toString(36).substring(2, 9)}`,
          }))
        : undefined,
      fileConfig: field.fileConfig ? { ...field.fileConfig } : undefined,
      customStyles: field.customStyles ? { ...field.customStyles } : undefined,
    };
    
    return normalizedField;
  });
  
  // Create a mapping of old field IDs to new field IDs for updating references
  const fieldIdMap = new Map<string, string>();
  template.fields.forEach((originalField, index) => {
    const newId = normalizedFields[index].id;
    fieldIdMap.set(originalField.id, newId);
  });
  
  // Update conditional logic references to use new field IDs
  normalizedFields.forEach(field => {
    if (field.conditionalLogic) {
      field.conditionalLogic = field.conditionalLogic.map(rule => ({
        ...rule,
        sourceFieldId: fieldIdMap.get(rule.sourceFieldId) || rule.sourceFieldId,
      }));
    }
  });
  
  // Apply multi-step configuration if template includes it
  let normalizedMultiStepConfig: MultiStepConfig | undefined = undefined;
  
  if (template.multiStep) {
    // Update stepId references in fields
    normalizedFields.forEach(field => {
      if (field.stepId) {
        // stepId remains the same, but we need to ensure it matches a step in the config
        const stepExists = template.multiStep?.steps.some(step => step.id === field.stepId);
        if (!stepExists) {
          // If step doesn't exist, remove the stepId
          delete field.stepId;
        }
      }
    });
    
    // Deep clone multi-step configuration and update field ID references
    normalizedMultiStepConfig = {
      ...template.multiStep,
      steps: template.multiStep.steps.map(step => ({
        ...step,
        // Update fieldIds to use new unique IDs
        fieldIds: step.fieldIds
          .map(oldId => fieldIdMap.get(oldId))
          .filter((id): id is string => id !== undefined),
      })),
    };
  }
  
  return {
    title: template.name,
    fields: normalizedFields,
    multiStepConfig: normalizedMultiStepConfig,
  };
}
