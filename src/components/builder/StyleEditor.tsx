"use client";

import { FormStyling } from "@/types/form";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Upload, X } from "lucide-react";

interface StyleEditorProps {
  styling: FormStyling | undefined;
  onChange: (styling: FormStyling) => void;
  formId?: string;
}

const defaultStyling: FormStyling = {
  primaryColor: "#000000",
  backgroundColor: "#ffffff",
  buttonColor: "#000000",
  buttonTextColor: "#ffffff",
  fontFamily: "system",
  buttonRadius: 8,
};

export default function StyleEditor({ styling, onChange, formId }: StyleEditorProps) {
  const currentStyling = styling || defaultStyling;
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const backgroundColorRef = useRef<HTMLInputElement>(null);
  const buttonColorRef = useRef<HTMLInputElement>(null);
  const buttonTextColorRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateStyling(patch: Partial<FormStyling>) {
    onChange({ ...currentStyling, ...patch });
  }

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("formId", formId || "temp-builder");
    formData.append("submissionId", "builder-assets");
    formData.append("fieldId", "header-image");
    formData.append("acceptedTypes", "images");

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      updateStyling({ headerImage: data.url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    colorRef 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    colorRef: React.RefObject<HTMLInputElement | null>;
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
    <div className="space-y-6">
      {/* Header Image Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Header Image</h3>
        <div className="space-y-2">
          {currentStyling.headerImage ? (
            <div className="relative rounded-md border border-gray-200 overflow-hidden group">
              <img 
                src={currentStyling.headerImage} 
                alt="Header" 
                className="w-full h-24 object-cover"
              />
              <button
                onClick={() => updateStyling({ headerImage: undefined })}
                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full hover:bg-white text-gray-600 hover:text-red-500 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Spinner size="sm" />
                  <span className="text-xs">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Click to upload header image</span>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeaderImageUpload}
            disabled={uploading}
          />
        </div>
      </div>

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
            <option value="inter">Inter</option>
            <option value="roboto">Roboto</option>
            <option value="open-sans">Open Sans</option>
            <option value="lato">Lato</option>
            <option value="montserrat">Montserrat</option>
            <option value="playfair">Playfair Display</option>
            <option value="merriweather">Merriweather</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="times">Times New Roman</option>
            <option value="courier">Courier New</option>
            <option value="poppins">Poppins</option>
            <option value="raleway">Raleway</option>
            <option value="nunito">Nunito</option>
            <option value="rubik">Rubik</option>
            <option value="pt-serif">PT Serif</option>
            <option value="source-serif">Source Serif Pro</option>
            <option value="fira-code">Fira Code</option>
            <option value="jetbrains-mono">JetBrains Mono</option>
            <option value="patrick-hand">Patrick Hand</option>
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
    case "inter":
      return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "roboto":
      return '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "open-sans":
      return '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "lato":
      return '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "montserrat":
      return '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "playfair":
      return '"Playfair Display", "Times New Roman", serif';
    case "merriweather":
      return '"Merriweather", "Times New Roman", serif';
    case "arial":
      return "Arial, Helvetica, sans-serif";
    case "georgia":
      return "Georgia, serif";
    case "times":
      return '"Times New Roman", Times, serif';
    case "courier":
      return '"Courier New", Courier, monospace';
    case "poppins":
      return '"Poppins", sans-serif';
    case "raleway":
      return '"Raleway", sans-serif';
    case "nunito":
      return '"Nunito", sans-serif';
    case "rubik":
      return '"Rubik", sans-serif';
    case "pt-serif":
      return '"PT Serif", serif';
    case "source-serif":
      return '"Source Serif Pro", serif';
    case "fira-code":
      return '"Fira Code", monospace';
    case "jetbrains-mono":
      return '"JetBrains Mono", monospace';
    case "patrick-hand":
      return '"Patrick Hand", cursive';
    case "system":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}