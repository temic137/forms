"use client";

import { FormStyling } from "@/types/form";
import { useRef, useState } from "react";

interface StyleEditorProps {
  styling: FormStyling | undefined;
  onChange: (styling: FormStyling) => void;
}

const defaultStyling: FormStyling = {
  primaryColor: "#000000",
  backgroundColor: "#ffffff",
  buttonColor: "#000000",
  buttonTextColor: "#ffffff",
  fontFamily: "system",
  buttonRadius: 8,
};

export default function StyleEditor({ styling, onChange }: StyleEditorProps) {
  const currentStyling = styling || defaultStyling;
  const [showPreview, setShowPreview] = useState(true);
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const backgroundColorRef = useRef<HTMLInputElement>(null);
  const buttonColorRef = useRef<HTMLInputElement>(null);
  const buttonTextColorRef = useRef<HTMLInputElement>(null);

  function updateStyling(patch: Partial<FormStyling>) {
    onChange({ ...currentStyling, ...patch });
  }

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    colorRef 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    colorRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-md border-2 border-gray-300 shadow-sm cursor-pointer overflow-hidden hover:border-blue-400 transition-colors"
          style={{ backgroundColor: value }}
          onClick={() => colorRef.current?.click()}
          title={label}
        >
          <input
            ref={colorRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Form Colors Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Form Colors</h3>
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Primary</label>
            <ColorPicker
              label="Primary Color"
              value={currentStyling.primaryColor}
              onChange={(value) => updateStyling({ primaryColor: value })}
              colorRef={primaryColorRef}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Background</label>
            <ColorPicker
              label="Background Color"
              value={currentStyling.backgroundColor}
              onChange={(value) => updateStyling({ backgroundColor: value })}
              colorRef={backgroundColorRef}
            />
          </div>
        </div>
      </div>

      {/* Button Colors Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Button</h3>
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Color</label>
            <ColorPicker
              label="Button Color"
              value={currentStyling.buttonColor}
              onChange={(value) => updateStyling({ buttonColor: value })}
              colorRef={buttonColorRef}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Text</label>
            <ColorPicker
              label="Button Text Color"
              value={currentStyling.buttonTextColor}
              onChange={(value) => updateStyling({ buttonTextColor: value })}
              colorRef={buttonTextColorRef}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">
              Radius: <span className="font-medium text-gray-700">{currentStyling.buttonRadius}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={currentStyling.buttonRadius}
              onChange={(e) => updateStyling({ buttonRadius: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Typography Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Typography</h3>
        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Font Family</label>
          <select
            value={currentStyling.fontFamily}
            onChange={(e) => updateStyling({ fontFamily: e.target.value as FormStyling["fontFamily"] })}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="system">System Default</option>
            <option value="sans">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
        </div>
      </div>

      {/* Preview Section */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between text-xs font-medium text-gray-700 mb-2 hover:text-gray-900 transition-colors"
        >
          <span>Preview</span>
          <svg
            className={`w-3 h-3 transition-transform ${showPreview ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showPreview && (
          <div 
            className="p-3 rounded-md border border-gray-200 bg-white"
            style={{ 
              backgroundColor: currentStyling.backgroundColor,
              fontFamily: getFontFamily(currentStyling.fontFamily)
            }}
          >
            <p 
              className="text-xs mb-2.5"
              style={{ color: currentStyling.primaryColor }}
            >
              Sample text
            </p>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: currentStyling.buttonColor,
                color: currentStyling.buttonTextColor,
                borderRadius: `${currentStyling.buttonRadius}px`,
              }}
            >
              Button
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getFontFamily(family: FormStyling["fontFamily"]): string {
  switch (family) {
    case "sans":
      return "ui-sans-serif, system-ui, sans-serif";
    case "serif":
      return "ui-serif, Georgia, serif";
    case "mono":
      return "ui-monospace, monospace";
    case "system":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}
