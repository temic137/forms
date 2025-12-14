"use client";

import { useState, useEffect } from 'react';

interface VoiceInputTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Tutorial overlay for first-time voice input users
 * Requirement 13.1: Display tutorial for first-time users
 */
export default function VoiceInputTutorial({ onComplete, onSkip }: VoiceInputTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Voice Input",
      content: "Create forms faster by speaking naturally. Just describe what you need, and we'll generate the form for you.",
      icon: <WelcomeIcon />,
    },
    {
      title: "How to Describe Your Form",
      content: "Speak naturally like: 'I need a contact form with name, email, phone number, and a message field.' Be specific about field types and requirements.",
      icon: <SpeakIcon />,
      example: "Example: 'Create a registration form with first name, last name, email address, password, and a checkbox to agree to terms'",
    },
    {
      title: "Edit and Refine",
      content: "After recording, you can edit the transcription to fix any errors. The text area is fully editable before generating your form.",
      icon: <EditIcon />,
    },
    {
      title: "Generate Your Form",
      content: "When you're happy with the description, click 'Generate Form' and we'll create all the fields automatically. You can customize them afterwards.",
      icon: <GenerateIcon />,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Prevent body scroll when tutorial is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 id="tutorial-title" className="text-xl font-semibold text-black">
              {currentStepData.title}
            </h2>
            <button
              onClick={onSkip}
              className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded p-1"
              aria-label="Skip tutorial"
            >
              <CloseIcon />
            </button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex gap-1.5 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-black' : 'bg-neutral-200'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-4 text-black" aria-hidden="true">
              {currentStepData.icon}
            </div>

            {/* Description */}
            <p className="text-neutral-700 text-base leading-relaxed mb-4">
              {currentStepData.content}
            </p>

            {/* Example (if present) */}
            {currentStepData.example && (
              <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-sm text-blue-900 italic">
                  {currentStepData.example}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded px-3 py-2"
          >
            Skip Tutorial
          </button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function WelcomeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M32 16C27.5817 16 23.3451 17.7554 20.2446 20.8559C17.1441 23.9564 15.3887 28.193 15.3887 32.6113C15.3887 37.0296 17.1441 41.2662 20.2446 44.3667C23.3451 47.4672 27.5817 49.2226 32 49.2226C36.4183 49.2226 40.6549 47.4672 43.7554 44.3667C46.8559 41.2662 48.6113 37.0296 48.6113 32.6113C48.6113 28.193 46.8559 23.9564 43.7554 20.8559C40.6549 17.7554 36.4183 16 32 16Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 26V32.6113"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="38" r="1.5" fill="currentColor" />
    </svg>
  );
}

function SpeakIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M32 18C29.6131 18 27.3239 18.9482 25.636 20.636C23.9482 22.3239 23 24.6131 23 27V35C23 37.3869 23.9482 39.6761 25.636 41.364C27.3239 43.0518 29.6131 44 32 44C34.3869 44 36.6761 43.0518 38.364 41.364C40.0518 39.6761 41 37.3869 41 35V27C41 24.6131 40.0518 22.3239 38.364 20.636C36.6761 18.9482 34.3869 18 32 18Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 35C17 38.713 18.475 42.274 21.1005 44.8995C23.726 47.525 27.287 49 31 49H33C36.713 49 40.274 47.525 42.8995 44.8995C45.525 42.274 47 38.713 47 35"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 44V50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M38 18L46 26L28 44H20V36L38 18Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M34 22L42 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M20 24C20 22.9391 20.4214 21.9217 21.1716 21.1716C21.9217 20.4214 22.9391 20 24 20H40C41.0609 20 42.0783 20.4214 42.8284 21.1716C43.5786 21.9217 44 22.9391 44 24V40C44 41.0609 43.5786 42.0783 42.8284 42.8284C42.0783 43.5786 41.0609 44 40 44H24C22.9391 44 21.9217 43.5786 21.1716 42.8284C20.4214 42.0783 20 41.0609 20 40V24Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M26 28H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 34H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 40H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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
