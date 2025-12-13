"use client";

import { Field, FormStyling } from "@/types/form";
import { useMemo } from "react";

interface FieldRendererProps {
  field: Field;
  isPreview?: boolean;
  styling?: FormStyling;
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

export default function FieldRenderer({ field, isPreview = false, styling }: FieldRendererProps) {
  const cssVariables = useMemo(() => {
    if (!styling) return {};
    return {
      '--form-primary-color': styling.primaryColor,
      '--form-bg-color': styling.backgroundColor,
      '--form-button-color': styling.buttonColor,
      '--form-button-text-color': styling.buttonTextColor,
      '--form-button-radius': `${styling.buttonRadius}px`,
    } as React.CSSProperties;
  }, [styling]);
  
  const fontFamily = useMemo(
    () => (styling ? getFontFamily(styling.fontFamily) : undefined),
    [styling]
  );
  const isDisplayOnly = [
    "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video"
  ].includes(field.type);

  const renderFieldInput = () => {
    switch (field.type) {
      // Text Inputs
      case "short-answer":
      case "text":
        return (
          <input
            type="text"
            placeholder={field.placeholder || "Your answer"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "long-answer":
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder || "Your answer"}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-vertical transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      // Contact Info
      case "email":
        return (
          <input
            type="email"
            placeholder={field.placeholder || "your@email.com"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            placeholder={field.placeholder || "+1 (555) 000-0000"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "address":
        return (
          <div className="space-y-2">
            <input type="text" placeholder="Street Address" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="City" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
              <input type="text" placeholder="State/Province" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="ZIP/Postal Code" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
              <input type="text" placeholder="Country" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
          </div>
        );

      // Choices
      case "multiple-choice":
      case "choices":
      case "radio":
        return (
          <div className="space-y-2">
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={field.id} disabled={!isPreview} className="w-4 h-4" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
      case "select":
        return (
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          >
            <option value="">Select an option...</option>
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case "checkboxes":
      case "multiselect":
        return (
          <div className="space-y-2">
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" disabled={!isPreview} className="w-4 h-4" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!isPreview} className="w-4 h-4" />
            <span className="text-gray-700">{field.placeholder || "I agree"}</span>
          </label>
        );

      case "switch":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative inline-block w-12 h-6">
              <input type="checkbox" disabled={!isPreview} className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-gray-700">{field.label}</span>
          </label>
        );

      case "picture-choice":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, i) => (
              <label key={i} className="relative cursor-pointer">
                <input 
                  type="radio" 
                  name={field.id} 
                  value={option}
                  disabled={!isPreview}
                  className="peer sr-only"
                />
                <div className="rounded-lg border-2 border-gray-200 p-3 transition-all hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <div className="aspect-square bg-white rounded-md flex items-center justify-center overflow-hidden mb-3 relative border border-gray-100">
                      {field.optionImages?.[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={field.optionImages[i]} alt={option} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">{option}</span>
                    </div>
                </div>
              </label>
            ))}
          </div>
        );

      case "choice-matrix":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-50"></th>
                  {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
                      {option}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(field.matrixRows || ["Row 1", "Row 2", "Row 3"]).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{row}</td>
                    {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, colIdx) => (
                      <td key={colIdx} className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type={field.allowMultipleSelection ? "checkbox" : "radio"}
                          name={`matrix-${field.id}-${rowIdx}`}
                          disabled={!isPreview}
                          className="w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Date & Time
      case "date":
      case "date-picker":
        return (
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "time":
      case "time-picker":
        return (
          <input
            type="time"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "datetime-picker":
        return (
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "date-range":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
          </div>
        );

      // Rating & Ranking
      case "star-rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                className="text-gray-300 hover:text-yellow-400 transition-colors" 
                disabled={!isPreview}
                type="button"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-8 h-8"
                >
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 4.646 1.251 5.318c.277 1.162-1.074 2.056-1.987 1.488L12 18.771l-4.695 2.636c-.913.568-2.264-.326-1.987-1.488l1.251-5.318-4.117-4.646c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        );

      case "slider":
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!isPreview}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        );

      case "opinion-scale":
        return (
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={!isPreview}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case "ranking":
        return (
          <div className="space-y-2">
            {(field.options || ["Item 1", "Item 2", "Item 3"]).map((option, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                <svg className="w-5 h-5 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
                <span className="flex-1">{option}</span>
                <span className="text-sm text-gray-500">#{idx + 1}</span>
              </div>
            ))}
          </div>
        );

      // Number
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder || "0"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isPreview}
            />
          </div>
        );

      // Display Elements
      case "h1":
        return (
          <h1 
            className="text-4xl font-bold"
            style={{ color: styling?.primaryColor || '#111827' }}
          >
            {field.label}
          </h1>
        );

      case "heading":
        return (
          <h2 
            className="text-2xl font-bold"
            style={{ color: styling?.primaryColor || '#111827' }}
          >
            {field.label}
          </h2>
        );

      case "paragraph":
      case "display-text":
        return (
          <p style={{ color: styling?.primaryColor || '#374151' }}>
            {field.helpText || field.label}
          </p>
        );

      case "banner":
        return (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-900 font-medium">{field.label}</p>
            {field.helpText && <p className="text-blue-700 text-sm mt-1">{field.helpText}</p>}
          </div>
        );

      case "divider":
        return <hr className="border-t-2 border-gray-300" />;

      case "image":
        if (field.imageUrl || field.helpText) {
          return (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={field.imageUrl || field.helpText}
                alt={field.label || "Image"}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          );
        }
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-2">Image will be displayed here</p>
          </div>
        );

      // File Upload
      case "file":
      case "file-uploader":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mt-2">Click to upload or drag and drop</p>
            <p className="text-gray-400 text-sm mt-1">Max file size: 10MB</p>
          </div>
        );

      default:
        return (
          <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
            {field.type} field (preview not implemented)
          </div>
        );
    }
  };

  const containerStyle = {
    ...cssVariables,
    fontFamily: fontFamily,
    backgroundColor: styling?.backgroundColor,
    color: styling?.primaryColor,
  } as React.CSSProperties;

  return (
    <div className="space-y-2" style={containerStyle}>
      {!isDisplayOnly && (
        <label 
          className="block text-sm font-medium"
          style={{ color: styling?.primaryColor || '#111827' }}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {field.helpText && !isDisplayOnly && (
        <p className="text-sm" style={{ color: styling?.primaryColor ? 'rgba(0,0,0,0.6)' : '#4b5563' }}>
          {field.helpText}
        </p>
      )}
      {renderFieldInput()}
    </div>
  );
}

