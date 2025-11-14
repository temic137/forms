"use client";

import { useState } from "react";
import { templates, Template } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export default function TemplateSelector({
  onSelectTemplate,
  onClose,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates =
    selectedCategory === "All"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Start with a pre-built template and customize it to your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-white text-black"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#2a2a2a]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="text-left p-6 border-2 border-[#2a2a2a] rounded-lg hover:border-white hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl" role="img" aria-label={template.name}>
                    {template.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-gray-300 transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-xs text-gray-400 bg-[#1a1a1a] px-2 py-1 rounded mt-1 inline-block">
                      {template.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.fields.length} fields</span>
                  {template.multiStep && (
                    <span className="bg-white text-black px-2 py-1 rounded font-medium">
                      Multi-step
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 Tip: All templates are fully customizable after selection
          </p>
        </div>
      </div>
    </div>
  );
}
