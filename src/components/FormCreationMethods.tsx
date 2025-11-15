"use client";

import { useState } from "react";
import { 
  Mic, 
  Upload, 
  Camera, 
  MessageSquare,
  ChevronRight,
  Sparkles,
  FileJson,
} from "lucide-react";

export type CreationMethod = "prompt" | "voice" | "file" | "scan" | "json";

interface FormCreationMethodsProps {
  onMethodSelect: (method: CreationMethod) => void;
  selectedMethod?: CreationMethod;
}

const methods = [
  {
    id: "prompt" as CreationMethod,
    title: "AI Prompt",
    description: "Describe your form in plain text and let AI generate it",
    icon: MessageSquare,
    features: ["Natural language", "Smart field detection", "Instant generation"],
  },
  {
    id: "voice" as CreationMethod,
    title: "Voice Input",
    description: "Speak your form requirements using voice recognition",
    icon: Mic,
    features: ["Hands-free", "Multi-language", "Real-time transcription"],
  },
  {
    id: "file" as CreationMethod,
    title: "File Upload",
    description: "Upload a CSV, Excel, or text file with field definitions",
    icon: Upload,
    features: ["CSV support", "Excel compatible", "Bulk import"],
  },
  {
    id: "json" as CreationMethod,
    title: "JSON Import",
    description: "Import form structure from JSON configuration",
    icon: FileJson,
    features: ["Direct structure", "Developer-friendly", "Full control"],
  },
  {
    id: "scan" as CreationMethod,
    title: "Scan Document",
    description: "Upload an image or PDF of an existing form to replicate",
    icon: Camera,
    features: ["OCR powered", "Image/PDF support", "Form recognition"],
  },
];

export default function FormCreationMethods({
  onMethodSelect,
  selectedMethod,
}: FormCreationMethodsProps) {
  const [hoveredMethod, setHoveredMethod] = useState<CreationMethod | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <div 
          className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4"
          style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
          }}
        >
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 
          className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 px-4"
          style={{ color: 'var(--foreground)' }}
        >
          How would you like to create your form?
        </h2>
        <p 
          className="text-base sm:text-lg px-4"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Choose the method that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isHovered = hoveredMethod === method.id;

          return (
            <div
              key={method.id}
              role="button"
              tabIndex={0}
              onClick={() => onMethodSelect(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onMethodSelect(method.id);
                }
              }}
              className={`
                card card-interactive relative group text-left p-6 transition-all duration-200
                hover:-translate-y-1 focus:-translate-y-1 focus:outline-none
                ${isSelected ? "ring-2 ring-[color:var(--accent)]" : ""}
              `}
              style={{
                borderRadius: 'var(--card-radius-lg)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--card-border)',
                boxShadow: isSelected || isHovered ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
                transform: isSelected ? 'translateY(-4px)' : undefined,
              }}
            >
              {/* Icon with gradient background */}
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-transform duration-200"
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  transform: isHovered || isSelected ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Icon className="w-7 h-7" />
              </div>

              {/* Title and description */}
              <h3 
                className="text-xl font-bold mb-2 flex items-center justify-between"
                style={{ color: 'var(--foreground)' }}
              >
                {method.title}
                {isSelected && (
                  <span 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </h3>
              <p 
                className="text-sm mb-4 leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {method.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {method.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <ChevronRight 
                      className="w-4 h-4 mr-2"
                      style={{ color: 'var(--foreground-muted)' }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Action indicator */}
              <div
                className={`
                absolute bottom-6 right-6 transition-all duration-300
                ${isHovered || isSelected ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
              `}
              >
                <ChevronRight
                  className="w-6 h-6"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground-muted)' }}
                />
              </div>

              {/* Selected overlay */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse"
                  style={{
                    border: '2px solid var(--accent)',
                    borderRadius: 'var(--card-radius-lg)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="mt-8 text-center">
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          💡 Tip: You can switch between methods at any time during form creation
        </p>
      </div>
    </div>
  );
}
