"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Field, FieldType, FormStyling } from "@/types/form";
import FieldPalette, { fieldTemplates } from "./FieldPalette";
import DraggableField from "./DraggableField";
import FieldRenderer from "./FieldRenderer";

interface DragDropFormBuilderProps {
  formTitle: string;
  fields: Field[];
  styling?: FormStyling;
  onFormTitleChange: (title: string) => void;
  onFieldsChange: (fields: Field[]) => void;
  onStylingChange: (styling: FormStyling | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function DragDropFormBuilder({
  formTitle,
  fields,
  styling,
  onFormTitleChange,
  onFieldsChange,
  onStylingChange,
  onSave,
  onCancel,
  saving = false,
}: DragDropFormBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleFieldSelect = (fieldType: FieldType) => {
    const template = fieldTemplates.find(t => t.type === fieldType);
    const newField: Field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: template?.defaultLabel || "New Field",
      type: fieldType,
      required: false,
      options: ["multiple-choice", "choices", "dropdown", "multiselect", "checkboxes", "radio", "select", "ranking"].includes(fieldType)
        ? ["Option 1", "Option 2", "Option 3"]
        : undefined,
      order: fields.length,
      conditionalLogic: [],
      color: "#ffffff",
    };
    
    onFieldsChange([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
          ...field,
          order: index,
        }));
        onFieldsChange(reorderedFields);
      }
    }
    
    setActiveId(null);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    onFieldsChange(
      fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const handleFieldDelete = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleFieldDuplicate = (fieldId: string) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (fieldToDuplicate) {
      const newField: Field = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${fieldToDuplicate.label} (Copy)`,
        order: fields.length,
      };
      onFieldsChange([...fields, newField]);
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType") as FieldType;
    if (fieldType) {
      handleFieldSelect(fieldType);
    }
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Field Palette & Theme Settings */}
      <FieldPalette 
        onFieldSelect={handleFieldSelect}
        styling={styling}
        onStylingChange={onStylingChange}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => onFormTitleChange(e.target.value)}
              className="text-2xl font-bold w-full px-3 py-2 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-lg transition-colors"
              placeholder="Untitled Form"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 border-2 border-white border-opacity-25 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {saving ? "Saving..." : "Save Form"}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-y-auto p-8"
          style={{ 
            backgroundColor: styling?.backgroundColor || '#f3f4f6',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => setActiveId(event.active.id as string)}
              onDragEnd={handleDragEnd}
            >
              {fields.length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center bg-white shadow-sm"
                  onDrop={handleDropZoneDrop}
                  onDragOver={handleDropZoneDragOver}
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Start building your form</h3>
                    <p className="text-gray-600 mb-8 text-sm">Drag fields from the left panel or click on a field type to add it</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => handleFieldSelect("short-answer")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        + Short Answer
                      </button>
                      <button
                        onClick={() => handleFieldSelect("multiple-choice")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        + Multiple Choice
                      </button>
                      <button
                        onClick={() => handleFieldSelect("email")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        + Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="space-y-4"
                  onDrop={handleDropZoneDrop}
                  onDragOver={handleDropZoneDragOver}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                      <DraggableField
                        key={field.id}
                        field={field}
                        index={index}
                        isSelected={selectedFieldId === field.id}
                        styling={styling}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onDelete={() => handleFieldDelete(field.id)}
                        onDuplicate={() => handleFieldDuplicate(field.id)}
                        onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                      />
                    ))}
                  </SortableContext>

                  {/* Add Field Button */}
                  <button
                    onClick={() => handleFieldSelect("short-answer")}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium text-sm shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Field
                    </div>
                  </button>
                </div>
              )}

              <DragOverlay>
                {activeId ? (
                  <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-2xl ring-2 ring-blue-500/20 opacity-95">
                    <FieldRenderer field={fields.find(f => f.id === activeId)!} styling={styling} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}

