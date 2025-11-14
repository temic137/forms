"use client";

import { useState, ReactNode } from "react";
import { MultiStepConfig, FormStep } from "@/types/form";

interface MultiStepRendererProps {
  config: MultiStepConfig;
  steps: FormStep[];
  children: (stepFieldIds: string[]) => ReactNode;
  onStepChange?: (stepIndex: number) => void;
  onValidateStep?: (stepIndex: number) => Promise<boolean>;
  isLastStep?: boolean;
  submitLabel?: string;
}

export default function MultiStepRenderer({
  config,
  steps,
  children,
  onStepChange,
  onValidateStep,
  isLastStep = false,
  submitLabel = "Submit",
}: MultiStepRendererProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isFinalStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  async function handleNext() {
    // Validate current step before proceeding
    if (onValidateStep) {
      setIsValidating(true);
      const isValid = await onValidateStep(currentStepIndex);
      setIsValidating(false);
      
      if (!isValid) {
        return;
      }
    }

    if (!isFinalStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(nextIndex);
    }
  }

  function handlePrevious() {
    if (!isFirstStep && config.allowBackNavigation) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(prevIndex);
    }
  }

  if (!currentStep) {
    return <div className="text-sm text-neutral-500">No steps configured</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {config.showProgressBar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span className="font-medium">{currentStep.title}</span>
            <span className="text-xs">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>
          {currentStep.description && (
            <p className="text-xs text-neutral-500">{currentStep.description}</p>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-5">
        {children(currentStep.fieldIds)}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <div>
          {!isFirstStep && config.allowBackNavigation && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-6 py-2 text-sm text-neutral-600 hover:text-black transition-colors"
            >
              ← Previous
            </button>
          )}
        </div>
        <div>
          {!isFinalStep ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isValidating}
              className="px-8 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? "Validating..." : "Next →"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLastStep}
              className="px-8 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
