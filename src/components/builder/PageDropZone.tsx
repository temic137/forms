"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";

interface PageDropZoneProps {
  pageId: string;
  isEmpty?: boolean;
  children?: React.ReactNode;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
}

export default function PageDropZone({ 
  pageId, 
  isEmpty = false, 
  children,
  onDrop,
  onDragOver,
  onDragLeave,
}: PageDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-drop-${pageId}`,
  });
  const [isNativeDragOver, setIsNativeDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeDragOver(false);
    if (onDrop) {
      onDrop(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsNativeDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsNativeDragOver(false);
    }
    if (onDragLeave) {
      onDragLeave(e);
    }
  };

  const isDragOver = isOver || isNativeDragOver;

  return (
    <div
      ref={setNodeRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`min-h-[60px] rounded-lg transition-colors ${
        isDragOver
          ? "border-2 border-blue-500 bg-blue-50"
          : isEmpty
          ? "border-2 border-dashed border-gray-300 bg-gray-50/50"
          : "border-2 border-dashed border-transparent"
      } ${isEmpty ? "flex items-center justify-center" : ""}`}
    >
      {isEmpty && !isDragOver && (
        <div className="text-center py-8 text-sm text-gray-400">
          Drop fields here or drag from field palette
        </div>
      )}
      {isDragOver && (
        <div className="text-center py-8 text-sm text-blue-600 font-medium">
          Drop here to add to this page
        </div>
      )}
      {children}
    </div>
  );
}

