"use client";

import { useState } from "react";
import { FormStep } from "@/types/form";

interface PageDividerProps {
  step: FormStep;
  pageNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<FormStep>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canDelete: boolean;
}

export default function PageDivider({
  step,
  pageNumber,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
}: PageDividerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(step.title);

  const handleTitleBlur = () => {
    if (tempTitle.trim()) {
      onUpdate({ title: tempTitle.trim() });
    } else {
      setTempTitle(step.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setTempTitle(step.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="my-8 bg-white border-2 border-blue-400 rounded-lg shadow-sm">
      {/* Page Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              Page {pageNumber}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 text-sm font-medium border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Page title"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-white/50 transition-colors"
              >
                {step.title || `Page ${pageNumber}`}
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {step.fieldIds.length} {step.fieldIds.length === 1 ? "field" : "fields"}
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {onMoveUp && !isFirst && (
            <button
              onClick={onMoveUp}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {onMoveDown && !isLast && (
            <button
              onClick={onMoveDown}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-white/50 rounded transition-colors"
              title="Delete page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Content area - fields will be rendered by parent component */}
    </div>
  );
}

