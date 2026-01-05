"use client";

import { useEffect } from 'react';

interface VoiceInputHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Help modal with best practices and troubleshooting guidance
 * Requirements 13.3, 13.4, 13.5: Display best practices, tips, and troubleshooting
 */
export default function VoiceInputHelpModal({ isOpen, onClose }: VoiceInputHelpModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl shadow-2xl animate-scale-in"
        style={{
          borderRadius: 'var(--card-radius-lg)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{
            borderBottom: '1px solid var(--divider)',
            background: 'var(--card-bg)',
          }}
        >
          <h2
            id="help-modal-title"
            className="text-xl font-semibold font-paper"
            style={{ color: 'var(--foreground)' }}
          >
            Voice Input Help & Best Practices
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors focus:outline-none"
            style={{ color: 'var(--foreground-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--foreground-muted)';
            }}
            aria-label="Close help modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ background: 'var(--card-bg)' }}
        >
          {/* Best Practices Section */}
          <section>
            <h3
              className="text-lg font-semibold mb-3 flex items-center gap-2 font-paper"
              style={{ color: 'var(--foreground)' }}
            >
              <BestPracticesIcon />
              Best Practices for Effective Descriptions
            </h3>
            <div className="space-y-3">
              <BestPracticeItem
                title="Be Specific About Field Types"
                description="Mention the type of input you need: text field, email, phone number, dropdown, checkbox, etc."
                example="'I need an email field, a phone number field, and a dropdown for country selection'"
              />
              <BestPracticeItem
                title="Specify Required Fields"
                description="Clearly state which fields are mandatory or optional."
                example="'Name and email are required, but phone number is optional'"
              />
              <BestPracticeItem
                title="Describe Validation Rules"
                description="Mention any specific validation requirements for your fields."
                example="'Password must be at least 8 characters with numbers and special characters'"
              />
              <BestPracticeItem
                title="Use Natural Language"
                description="Speak naturally as if explaining to a person. Don't worry about technical jargon."
                example="'I want a form where customers can tell us about their experience'"
              />
              <BestPracticeItem
                title="Mention Field Labels"
                description="Describe what each field should be called in the form."
                example="'Add a field labeled Full Name, another for Email Address, and one for Message'"
              />
            </div>
          </section>

          {/* Example Phrases Section */}
          <section>
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2 font-paper">
              <ExamplesIcon />
              Example Phrases That Work Well
            </h3>
            <div className="space-y-2">
              <ExamplePhrase
                text="I need a contact form with name, email, phone number, and a message field"
                category="Contact Form"
              />
              <ExamplePhrase
                text="Create a registration form with first name, last name, email address, password, and a checkbox to agree to terms"
                category="Registration"
              />
              <ExamplePhrase
                text="Make a survey with a rating from 1 to 5, multiple choice for favorite color with options red, blue, and green, and a comment box"
                category="Survey"
              />
              <ExamplePhrase
                text="I want a job application form with full name, email, phone, resume upload, and a text area for cover letter"
                category="Job Application"
              />
              <ExamplePhrase
                text="Build a feedback form with satisfaction rating, yes or no question about recommendation, and comments section"
                category="Feedback"
              />
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section>
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2 font-paper">
              <TroubleshootIcon />
              Troubleshooting Common Issues
            </h3>
            <div className="space-y-3">
              <TroubleshootItem
                problem="Microphone Not Working"
                solutions={[
                  "Check that your browser has permission to access the microphone",
                  "Make sure no other application is using the microphone",
                  "Try refreshing the page and granting permissions again",
                  "Check your system settings to ensure the microphone is enabled"
                ]}
              />
              <TroubleshootItem
                problem="Speech Not Being Recognized"
                solutions={[
                  "Speak clearly and at a moderate pace",
                  "Reduce background noise if possible",
                  "Make sure you're speaking in the selected language",
                  "Check that your microphone volume is adequate",
                  "Try moving closer to your microphone"
                ]}
              />
              <TroubleshootItem
                problem="Incorrect Transcription"
                solutions={[
                  "Edit the text directly in the transcription area before generating",
                  "Speak more slowly and enunciate clearly",
                  "Use the pause button to review and correct as you go",
                  "Avoid technical jargon that might be misunderstood"
                ]}
              />
              <TroubleshootItem
                problem="Form Generation Not Working"
                solutions={[
                  "Make sure your description includes specific field types",
                  "Try being more explicit about what you want",
                  "Check that you have an active internet connection",
                  "Review the transcription for clarity before generating",
                  "Try simplifying your description and add complexity later"
                ]}
              />
              <TroubleshootItem
                problem="Browser Not Supported"
                solutions={[
                  "Use Chrome, Edge, or Safari for best compatibility",
                  "Update your browser to the latest version",
                  "Use the manual text input as an alternative",
                  "Check browser compatibility at the top of the voice input panel"
                ]}
              />
            </div>
          </section>

          {/* Tips Section */}
          <section>
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2 font-paper">
              <TipsIcon />
              Pro Tips
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <TipItem text="Use the keyboard shortcut Ctrl+Shift+V to quickly toggle voice input" />
              <TipItem text="Your transcription is automatically saved every 5 seconds" />
              <TipItem text="You can edit the transcription while recording is paused" />
              <TipItem text="Start with a simple form and add more fields using voice input again" />
              <TipItem text="The audio level meter helps you know if you're speaking loud enough" />
              <TipItem text="You can switch languages mid-session if needed" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="p-6"
          style={{
            borderTop: '1px solid var(--divider)',
            background: 'var(--card-bg)',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-primary w-full font-medium font-paper"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface BestPracticeItemProps {
  title: string;
  description: string;
  example: string;
}

function BestPracticeItem({ title, description, example }: BestPracticeItemProps) {
  return (
    <div className="surface-muted p-4">
      <h4 className="font-medium mb-1 font-paper" style={{ color: 'var(--foreground)' }}>{title}</h4>
      <p className="text-sm mb-2 font-paper" style={{ color: 'var(--foreground-muted)' }}>{description}</p>
      <div
        className="surface-muted"
        style={{
          padding: '12px',
          borderColor: 'var(--divider)',
        }}
      >
        <p className="text-xs italic font-paper" style={{ color: 'var(--foreground)' }}>Example: {example}</p>
      </div>
    </div>
  );
}

interface ExamplePhraseProps {
  text: string;
  category: string;
}

function ExamplePhrase({ text, category }: ExamplePhraseProps) {
  return (
    <div className="surface-muted p-3">
      <div className="flex items-start gap-2">
        <span
          className="badge shrink-0"
          style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
          }}
        >
          {category}
        </span>
        <p className="text-sm italic font-paper" style={{ color: 'var(--foreground)' }}>"{text}"</p>
      </div>
    </div>
  );
}

interface TroubleshootItemProps {
  problem: string;
  solutions: string[];
}

function TroubleshootItem({ problem, solutions }: TroubleshootItemProps) {
  return (
    <div className="surface-muted p-4">
      <h4
        className="font-medium mb-2 flex items-center gap-2 font-paper"
        style={{ color: 'var(--foreground)' }}
      >
        <WarningIcon />
        {problem}
      </h4>
      <ul className="space-y-1.5">
        {solutions.map((solution, index) => (
          <li key={index} className="text-sm flex items-start gap-2 font-paper" style={{ color: 'var(--foreground-muted)' }}>
            <span className="shrink-0" style={{ color: 'var(--foreground-muted)' }}>•</span>
            <span>{solution}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TipItemProps {
  text: string;
}

function TipItem({ text }: TipItemProps) {
  return (
    <div className="flex items-start gap-2">
      <LightbulbIcon />
      <p className="text-sm font-paper" style={{ color: 'var(--accent)' }}>{text}</p>
    </div>
  );
}

// Icon Components
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BestPracticesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--success)' }}>
      <path
        d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
    </svg>
  );
}

function ExamplesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }}>
      <path
        d="M3 5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H15C15.5304 3 16.0391 3.21071 16.4142 3.58579C16.7893 3.96086 17 4.46957 17 5V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 7H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TroubleshootIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--warning)' }}>
      <path
        d="M10 2C8.68678 2 7.38642 2.25866 6.17317 2.7612C4.95991 3.26375 3.85752 4.00035 2.92893 4.92893C1.05357 6.8043 0 9.34784 0 12C0 14.6522 1.05357 17.1957 2.92893 19.0711C3.85752 19.9997 4.95991 20.7362 6.17317 21.2388C7.38642 21.7413 8.68678 22 10 22C12.6522 22 15.1957 20.9464 17.0711 19.0711C18.9464 17.1957 20 14.6522 20 12C20 10.6868 19.7413 9.38642 19.2388 8.17317C18.7362 6.95991 17.9997 5.85752 17.0711 4.92893C16.1425 4.00035 15.0401 3.26375 13.8268 2.7612C12.6136 2.25866 11.3132 2 10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="scale(0.5) translate(10, 10)"
      />
      <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.5" fill="currentColor" stroke="currentColor" />
    </svg>
  );
}

function TipsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }}>
      <path
        d="M10 2C8.68678 2 7.38642 2.25866 6.17317 2.7612C4.95991 3.26375 3.85752 4.00035 2.92893 4.92893C1.05357 6.8043 0 9.34784 0 12C0 14.6522 1.05357 17.1957 2.92893 19.0711C3.85752 19.9997 4.95991 20.7362 6.17317 21.2388C7.38642 21.7413 8.68678 22 10 22C12.6522 22 15.1957 20.9464 17.0711 19.0711C18.9464 17.1957 20 14.6522 20 12C20 10.6868 19.7413 9.38642 19.2388 8.17317C18.7362 6.95991 17.9997 5.85752 17.0711 4.92893C16.1425 4.00035 15.0401 3.26375 13.8268 2.7612C12.6136 2.25866 11.3132 2 10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="scale(0.5) translate(10, 10)"
      />
      <path d="M10 14V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6" r="0.5" fill="currentColor" stroke="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--warning)' }} className="shrink-0">
      <path
        d="M8 2L2 13H14L8 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5">
      <path
        d="M8 2C6.67392 2 5.40215 2.52678 4.46447 3.46447C3.52678 4.40215 3 5.67392 3 7C3 8.5 3.5 9.5 4.5 10.5L5 13H11L11.5 10.5C12.5 9.5 13 8.5 13 7C13 5.67392 12.4732 4.40215 11.5355 3.46447C10.5979 2.52678 9.32608 2 8 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M6 13V14C6 14.5304 6.21071 15.0391 6.58579 15.4142C6.96086 15.7893 7.46957 16 8 16C8.53043 16 9.03914 15.7893 9.41421 15.4142C9.78929 15.0391 10 14.5304 10 14V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
