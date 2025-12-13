"use client";

import { useState, useEffect } from "react";
import { X, Move, Palette, Settings, Play } from "lucide-react";

interface BuilderOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuilderOnboarding({ isOpen, onClose }: BuilderOnboardingProps) {
  const [step, setStep] = useState(0);

  const handleClose = () => {
    onClose();
    setStep(0); // Reset step when closed
  };

  const steps = [
    {
      title: "Welcome to the Form Builder!",
      description: "Let's take a quick tour to help you get started with creating amazing forms.",
      icon: <span className="text-4xl">👋</span>,
    },
    {
      title: "Drag & Drop Fields",
      description: "Pick fields from the left sidebar and drag them onto the canvas to build your form.",
      icon: <Move className="w-12 h-12 text-blue-500" />,
    },
    {
      title: "Customize Design",
      description: "Switch to the 'Theme' tab in the sidebar to change colors, fonts, and backgrounds.",
      icon: <Palette className="w-12 h-12 text-purple-500" />,
    },
    {
      title: "Configure Settings",
      description: "Use the settings menu to set up notifications, quiz mode, and more.",
      icon: <Settings className="w-12 h-12 text-gray-500" />,
    },
    {
      title: "Preview & Share",
      description: "Preview your form to see how it looks, then save and share it with the world!",
      icon: <Play className="w-12 h-12 text-green-500" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all">
        <div className="p-6 text-center">
          <div className="flex justify-end">
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-gray-50 rounded-full">
              {steps[step].icon}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[step].title}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {steps[step].description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    handleClose();
                  }
                }}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {step === steps.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
