"use client";

import { FieldType, FormStyling } from "@/types/form";

import { useState, useMemo } from "react";

export interface FieldTemplate {
  type: FieldType;
  label: string;
  icon: string;
  defaultLabel: string;
  category: string;
  recommended?: boolean;
}

export const fieldTemplates: FieldTemplate[] = [
  // Text
  { type: "short-answer", label: "Short Answer", icon: "📝", defaultLabel: "Your answer", category: "Text", recommended: true },
  { type: "long-answer", label: "Long Answer", icon: "📄", defaultLabel: "Your detailed answer", category: "Text" },
  { type: "text", label: "Text", icon: "✍️", defaultLabel: "Text input", category: "Text" },

  // Choices
  { type: "multiple-choice", label: "Multiple Choice", icon: "⭕", defaultLabel: "Select one option", category: "Choices", recommended: true },
  { type: "choices", label: "Choices", icon: "🔘", defaultLabel: "Pick an option", category: "Choices" },
  { type: "dropdown", label: "Dropdown", icon: "📋", defaultLabel: "Select from dropdown", category: "Choices", recommended: true },
  { type: "picture-choice", label: "Picture Choice", icon: "🖼️", defaultLabel: "Choose a picture", category: "Choices" },
  { type: "multiselect", label: "Multiselect", icon: "☑️", defaultLabel: "Select multiple", category: "Choices" },
  { type: "checkbox", label: "Checkbox", icon: "✅", defaultLabel: "Check if yes", category: "Choices" },
  { type: "checkboxes", label: "Checkboxes", icon: "✔️", defaultLabel: "Select all that apply", category: "Choices" },
  { type: "switch", label: "Switch", icon: "🔄", defaultLabel: "Toggle option", category: "Choices" },
  { type: "choice-matrix", label: "Choice Matrix", icon: "📊", defaultLabel: "Matrix selection", category: "Choices" },

  // Contact Info
  { type: "email", label: "Email", icon: "📧", defaultLabel: "Email address", category: "Contact Info", recommended: true },
  { type: "phone", label: "Phone Number", icon: "📱", defaultLabel: "Phone number", category: "Contact Info" },
  { type: "address", label: "Address", icon: "🏠", defaultLabel: "Full address", category: "Contact Info" },

  // Files
  { type: "file", label: "File Upload", icon: "📁", defaultLabel: "Upload a file", category: "Files" },
  { type: "file-uploader", label: "Upload", icon: "☁️", defaultLabel: "Upload file", category: "Files" },

  // Display
  { type: "display-text", label: "Display Text", icon: "💬", defaultLabel: "Information text", category: "Display" },
  { type: "h1", label: "H1 Heading", icon: "🔤", defaultLabel: "Main Heading", category: "Display" },
  { type: "heading", label: "Heading", icon: "📌", defaultLabel: "Section Heading", category: "Display" },
  { type: "paragraph", label: "Paragraph", icon: "📝", defaultLabel: "Description text", category: "Display" },
  { type: "banner", label: "Banner", icon: "🎯", defaultLabel: "Banner message", category: "Display" },
  { type: "divider", label: "Divider", icon: "➖", defaultLabel: "Section divider", category: "Display" },
  { type: "image", label: "Image", icon: "🖼️", defaultLabel: "Image display", category: "Display" },

  // Date & Time
  { type: "date-picker", label: "Date Picker", icon: "📅", defaultLabel: "Select date", category: "Date & Time" },
  { type: "time-picker", label: "Time Picker", icon: "🕐", defaultLabel: "Select time", category: "Date & Time" },
  { type: "datetime-picker", label: "Date Time Picker", icon: "📆", defaultLabel: "Select date and time", category: "Date & Time" },
  { type: "date-range", label: "Date Range", icon: "📊", defaultLabel: "Select date range", category: "Date & Time" },
  { type: "time", label: "Time", icon: "⏰", defaultLabel: "Enter time", category: "Date & Time" },

  // Rating & Ranking
  { type: "star-rating", label: "Star Rating", icon: "⭐", defaultLabel: "Rate from 1 to 5", category: "Rating & Ranking" },
  { type: "ranking", label: "Ranking", icon: "🔢", defaultLabel: "Rank in order", category: "Rating & Ranking" },
  { type: "slider", label: "Slider", icon: "🎚️", defaultLabel: "Slide to select", category: "Rating & Ranking" },
  { type: "opinion-scale", label: "Opinion Scale", icon: "📈", defaultLabel: "Rate on a scale", category: "Rating & Ranking" },

  // Number
  { type: "number", label: "Number", icon: "🔢", defaultLabel: "Enter a number", category: "Number" },
  { type: "currency", label: "Currency", icon: "💰", defaultLabel: "Enter amount", category: "Number" },

];

interface FieldPaletteProps {
  onFieldSelect: (fieldType: FieldType) => void;
  styling?: FormStyling;
  onStylingChange?: (styling: FormStyling) => void;
}

export default function FieldPalette({ onFieldSelect, styling, onStylingChange }: FieldPaletteProps) {
  const categories = Array.from(new Set(fieldTemplates.map(f => f.category)));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories));

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fieldTemplates;
    const query = searchQuery.toLowerCase();
    return fieldTemplates.filter(
      field =>
        field.label.toLowerCase().includes(query) ||
        field.category.toLowerCase().includes(query) ||
        field.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categoryGroups = useMemo(() => {
    const groups: Record<string, typeof fieldTemplates> = {};
    filteredFields.forEach(field => {
      if (!groups[field.category]) {
        groups[field.category] = [];
      }
      groups[field.category].push(field);
    });
    return groups;
  }, [filteredFields]);

  return (
    <div className="w-64 h-full flex flex-col border-r border-black/10 bg-white/50 backdrop-blur-sm font-paper">
      {/* Header */}
      <div className="p-2 border-b border-black/10 bg-transparent">
        <h2 className="text-[10px] font-bold text-black uppercase tracking-wider">Form Fields</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Mobile instruction banner */}
        <div className="lg:hidden mb-2 p-2 bg-transparent border border-black/20 rounded-lg border-dashed">
          <p className="text-[10px] text-black font-bold">
            💡 Tap any field below to add it to your form
          </p>
        </div>

        {/* Search */}
        <div className="mb-2">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fields..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-black/10 rounded-full focus:outline-none focus:border-black/30 bg-transparent placeholder:text-black/30 text-black font-bold"
            />
          </div>
        </div>

        {/* Recommended Fields */}
        {!searchQuery && (
          <div className="mb-3">
            <h3 className="px-1 mb-1.5 text-[10px] font-bold text-black/60 uppercase tracking-wider">
              Recommended
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {fieldTemplates.filter(f => f.recommended).map(field => (
                <button
                  key={`rec-${field.type}`}
                  onClick={() => onFieldSelect(field.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-black/10 hover:bg-black/5 transition-all text-center group shadow-none"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("fieldType", field.type);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <span className="text-xl mb-1 grayscale opacity-80">{field.icon}</span>
                  <span className="text-[10px] font-bold text-black group-hover:text-black">{field.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Field Categories */}
        <div className="space-y-1.5">
          {(searchQuery ? Object.keys(categoryGroups) : categories).map(category => {
            const fields = searchQuery ? categoryGroups[category] : fieldTemplates.filter(f => f.category === category);
            const isExpanded = searchQuery || expandedCategories.has(category);

            if (fields.length === 0) return null;

            return (
              <div key={category} className="rounded-xl overflow-hidden border border-black/5">
                {!searchQuery && (
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-2.5 py-1.5 bg-transparent hover:bg-black/5 flex items-center justify-between text-[10px] font-bold text-black transition-colors"
                  >
                    <span>{category}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                {isExpanded && (
                  <div className="p-0.5 space-y-0.5 bg-white/30">
                    {fields.map(field => (
                      <button
                        key={field.type}
                        onClick={() => onFieldSelect(field.type)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg
                                     hover:bg-black/5 text-black
                                     transition-colors text-[10px] font-bold group cursor-pointer
                                     active:bg-black/10 touch-manipulation"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("fieldType", field.type);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                      >
                        <span className="text-sm leading-none grayscale opacity-80">{field.icon}</span>
                        <span className="flex-1 truncate">{field.label}</span>
                        <span className="text-[10px] text-black/40 group-hover:text-black lg:hidden">+</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFields.length === 0 && (
          <div className="text-center py-6 text-black/40 text-xs font-bold">
            No fields found
          </div>
        )}
      </div>
    </div>
  );
}
