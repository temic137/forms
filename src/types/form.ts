// Field Types - Organized by category
export type FieldType =
  // Text Inputs
  | "short-answer"
  | "long-answer"
  | "text"
  | "textarea"
  
  // Contact Info
  | "email"
  | "phone"
  | "address"
  
  // Numbers
  | "number"
  | "currency"
  
  // Choices & Selection
  | "multiple-choice"
  | "choices"
  | "dropdown"
  | "picture-choice"
  | "multiselect"
  | "checkbox"
  | "checkboxes"
  | "radio"
  | "select"
  | "switch"
  | "choice-matrix"
  
  // Date & Time
  | "date"
  | "time"
  | "date-picker"
  | "datetime-picker"
  | "time-picker"
  | "date-range"
  
  // Rating & Ranking
  | "ranking"
  | "star-rating"
  | "slider"
  | "opinion-scale"
  
  // Display Elements
  | "display-text"
  | "h1"
  | "heading"
  | "paragraph"
  | "banner"
  | "divider"
  | "html"
  | "image"
  | "video"
  
  // File Uploads
  | "file"
  | "file-uploader"
  
  // Other
  | "tel"
  | "url"
  | "color-picker"
  | "password"
  | "signature"
  | "voice-recording"
  | "submission-picker"
  | "subform"
  | "captcha"
  | "location"
  | "table"
  | "section-collapse"
  | "pdf-viewer"
  | "social-links";

// Validation Rule Types
export interface ValidationRule {
  type: "minLength" | "maxLength" | "pattern" | "min" | "max" | "custom";
  value: string | number;
  message: string;
}

// Conditional Logic Types
export type ConditionalOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "isEmpty"
  | "isNotEmpty";

export interface ConditionalRule {
  id: string;
  sourceFieldId: string;
  operator: ConditionalOperator;
  value: string | number;
  action: "show" | "hide";
  logicOperator?: "AND" | "OR";
}

// File Upload Configuration
export interface FileUploadConfig {
  acceptedTypes: "images" | "documents" | "all";
  maxSizeMB: number;
  multiple: boolean;
}

// Field Styling
export interface FieldStyles {
  labelColor?: string;
  inputBgColor?: string;
  borderColor?: string;
}

// Field Interface
export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalRule[];
  stepId?: string;
  order: number;
  fileConfig?: FileUploadConfig;
  customStyles?: FieldStyles;
  color?: string; // New property for color editing
  matrixRows?: string[]; // For choice-matrix field type
}

// Multi-Step Form Types
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  fieldIds: string[];
}

export interface MultiStepConfig {
  enabled: boolean;
  steps: FormStep[];
  showProgressBar: boolean;
  allowBackNavigation: boolean;
}

// Form Styling
export interface FormStyling {
  primaryColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: "system" | "sans" | "serif" | "mono";
  buttonRadius: number;
}

// Notification Configuration
export interface EmailNotificationConfig {
  enabled: boolean;
  recipients: string[];
  includeSubmissionData: boolean;
  customMessage?: string;
  frequency?: "immediate" | "hourly" | "daily" | "weekly";
  batchSize?: number;
}

export interface SlackNotificationConfig {
  enabled: boolean;
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface DiscordNotificationConfig {
  enabled: boolean;
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface WebhookNotificationConfig {
  enabled: boolean;
  url: string;
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  secret?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  email?: EmailNotificationConfig;
  slack?: SlackNotificationConfig;
  discord?: DiscordNotificationConfig;
  webhook?: WebhookNotificationConfig;
  // Legacy support - will be migrated to email config
  recipients?: string[];
  includeSubmissionData?: boolean;
  customMessage?: string;
}

// File Metadata
export interface FileMetadata {
  id: string;
  submissionId: string;
  fieldId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedAt: Date;
}

// Error Display
export interface ErrorDisplay {
  field: string;
  message: string;
  type: "validation" | "server" | "network";
}

// Form Configuration
export interface FormConfig {
  id: string;
  title: string;
  fields: Field[];
  multiStep?: MultiStepConfig;
  styling?: FormStyling;
  notifications?: NotificationConfig;
  templateId?: string;
  conversationalMode?: boolean;
}

// File Upload Response
export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  expiresAt: Date;
}
