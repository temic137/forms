"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, DragOverEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { Field, FieldType, FormStyling, NotificationConfig, MultiStepConfig, FormStep } from "@/types/form";
import FieldPalette, { fieldTemplates } from "./FieldPalette";
import DraggableField from "./DraggableField";
import FieldRenderer from "./FieldRenderer";
import NotificationSettings from "./NotificationSettings";
import { Settings, Save, Eye, FileText, Plus, ArrowLeft } from "lucide-react";
import PageDivider from "./PageDivider";
import PageDropZone from "./PageDropZone";

interface DragDropFormBuilderProps {
  formTitle: string;
  fields: Field[];
  styling?: FormStyling;
  notifications?: NotificationConfig;
  multiStepConfig?: MultiStepConfig;
  onFormTitleChange: (title: string) => void;
  onFieldsChange: (fields: Field[]) => void;
  onStylingChange: (styling: FormStyling | undefined) => void;
  onNotificationsChange: (notifications: NotificationConfig | undefined) => void;
  onMultiStepConfigChange: (config: MultiStepConfig | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function DragDropFormBuilder({
  formTitle,
  fields,
  styling,
  notifications,
  multiStepConfig,
  onFormTitleChange,
  onFieldsChange,
  onStylingChange,
  onNotificationsChange,
  onMultiStepConfigChange,
  onSave,
  onCancel,
  saving = false,
}: DragDropFormBuilderProps) {
  const router = useRouter();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredDropIndex, setHoveredDropIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Helper: Get fields grouped by page
  const getFieldsByPage = () => {
    if (!multiStepConfig?.enabled || !multiStepConfig.steps.length) {
      return { pages: [], fieldsInPage: fields };
    }
    
    const pages = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
    const fieldsInPage = pages.flatMap(step => step.fieldIds.map(id => fields.find(f => f.id === id)).filter(Boolean) as Field[]);
    
    return { pages, fieldsInPage };
  };

  // Helper: Get which page a field belongs to
  const getFieldPage = (fieldId: string) => {
    if (!multiStepConfig?.enabled) return null;
    return multiStepConfig.steps.find(step => step.fieldIds.includes(fieldId))?.id || null;
  };

  // Helper: Auto-assign fields to pages based on order
  const autoAssignFieldsToPages = () => {
    if (!multiStepConfig?.enabled || !multiStepConfig.steps.length) return;
    
    const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
    const sortedFields = [...fields].sort((a, b) => a.order - b.order);
    
    // Distribute fields evenly across pages
    const fieldsPerPage = Math.ceil(sortedFields.length / sortedSteps.length);
    const newSteps = sortedSteps.map((step, stepIndex) => {
      const startIndex = stepIndex * fieldsPerPage;
      const endIndex = Math.min(startIndex + fieldsPerPage, sortedFields.length);
      const fieldIds = sortedFields.slice(startIndex, endIndex).map(f => f.id);
      return { ...step, fieldIds };
    });
    
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: newSteps,
    });
  };

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
    
    const newFields = [...fields, newField];
    onFieldsChange(newFields);
    setSelectedFieldId(newField.id);
    
    // Auto-assign to current/last page if multi-page enabled
    if (multiStepConfig?.enabled && multiStepConfig.steps.length > 0) {
      const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
      const lastStep = sortedSteps[sortedSteps.length - 1];
      onMultiStepConfigChange({
        ...multiStepConfig,
        steps: multiStepConfig.steps.map(s => 
          s.id === lastStep.id 
            ? { ...s, fieldIds: [...s.fieldIds, newField.id] }
            : s
        ),
      });
    }
  };

  const handleToggleMultiPage = () => {
    if (multiStepConfig?.enabled) {
      // Disable multi-page - assign all fields to first step, then disable
      onMultiStepConfigChange(undefined);
    } else {
      // Enable multi-page - create one page with all fields
      const firstStep = {
        id: `step_${Date.now()}`,
        title: "Page 1",
        order: 0,
        fieldIds: fields.map(f => f.id),
      };
      onMultiStepConfigChange({
        enabled: true,
        steps: [firstStep],
        showProgressBar: true,
        allowBackNavigation: true,
      });
    }
  };

  const handleAddPage = () => {
    if (!multiStepConfig?.enabled) return;
    
    const newPage: FormStep = {
      id: `step_${Date.now()}`,
      title: `Page ${multiStepConfig.steps.length + 1}`,
      order: multiStepConfig.steps.length,
      fieldIds: [],
    };
    
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: [...multiStepConfig.steps, newPage],
    });
  };

  const handleUpdatePage = (pageId: string, updates: Partial<FormStep>) => {
    if (!multiStepConfig?.enabled) return;
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: multiStepConfig.steps.map(s => s.id === pageId ? { ...s, ...updates } : s),
    });
  };

  const handleDeletePage = (pageId: string) => {
    if (!multiStepConfig?.enabled || multiStepConfig.steps.length <= 1) return;
    
    const deletedPage = multiStepConfig.steps.find(s => s.id === pageId);
    const remainingSteps = multiStepConfig.steps.filter(s => s.id !== pageId);
    
    // Move fields from deleted page to first remaining page
    if (deletedPage && remainingSteps.length > 0) {
      const firstRemaining = remainingSteps[0];
      remainingSteps[0] = {
        ...firstRemaining,
        fieldIds: [...firstRemaining.fieldIds, ...deletedPage.fieldIds],
      };
    }
    
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: remainingSteps.map((s, idx) => ({ ...s, order: idx })),
    });
  };

  const handleMovePageUp = (pageId: string) => {
    if (!multiStepConfig?.enabled) return;
    const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
    const index = sortedSteps.findIndex(s => s.id === pageId);
    if (index <= 0) return;
    
    [sortedSteps[index - 1], sortedSteps[index]] = [sortedSteps[index], sortedSteps[index - 1]];
    
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: sortedSteps.map((s, i) => ({ ...s, order: i })),
    });
  };

  const handleMovePageDown = (pageId: string) => {
    if (!multiStepConfig?.enabled) return;
    const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
    const index = sortedSteps.findIndex(s => s.id === pageId);
    if (index < 0 || index >= sortedSteps.length - 1) return;
    
    [sortedSteps[index], sortedSteps[index + 1]] = [sortedSteps[index + 1], sortedSteps[index]];
    
    onMultiStepConfigChange({
      ...multiStepConfig,
      steps: sortedSteps.map((s, i) => ({ ...s, order: i })),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Check if dragging a field
    const activeField = fields.find(f => f.id === activeId);
    
    if (!activeField) {
      setActiveId(null);
      return;
    }
    
    // Multi-page mode: handle page assignments
    if (multiStepConfig?.enabled && multiStepConfig.steps.length > 0) {
      // Check if dropping on a page drop zone
      if (overId.startsWith('page-drop-')) {
        const targetPageId = overId.replace('page-drop-', '');
        // Remove field from all pages
        const updatedSteps = multiStepConfig.steps.map(step => ({
          ...step,
          fieldIds: step.fieldIds.filter(id => id !== activeId),
        }));
        
        // Add to target page (at the end)
        const targetStep = updatedSteps.find(s => s.id === targetPageId);
        if (targetStep) {
          targetStep.fieldIds.push(activeId);
        }
        
        onMultiStepConfigChange({
          ...multiStepConfig,
          steps: updatedSteps,
        });
        setActiveId(null);
        return;
      }
      
      // Check if dropping on another field
      const overField = fields.find(f => f.id === overId);
      if (overField) {
        // Find which page the target field belongs to
        const targetPage = multiStepConfig.steps.find(step => step.fieldIds.includes(overId));
        const sourcePage = multiStepConfig.steps.find(step => step.fieldIds.includes(activeId));
        
        if (targetPage) {
          // Remove field from its current page
          const updatedSteps = multiStepConfig.steps.map(step => ({
            ...step,
            fieldIds: step.fieldIds.filter(id => id !== activeId),
          }));
          
          // Find the target step again after filtering
          const updatedTargetStep = updatedSteps.find(s => s.id === targetPage.id);
          if (updatedTargetStep) {
            // Find the index of the target field in the target page
            const targetFieldIndex = targetPage.fieldIds.indexOf(overId);
            
            // Insert the active field at the position of the target field
            updatedTargetStep.fieldIds.splice(targetFieldIndex, 0, activeId);
          }
          
          onMultiStepConfigChange({
            ...multiStepConfig,
            steps: updatedSteps,
          });
        }
        
        setActiveId(null);
        return;
      }
    } else {
      // Single-page mode: simple reordering
      const overField = fields.find(f => f.id === overId);
      if (overField) {
        const oldIndex = fields.findIndex(f => f.id === activeId);
        const newIndex = fields.findIndex(f => f.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
            ...field,
            order: index,
          }));
          onFieldsChange(reorderedFields);
        }
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

  const handleDropZoneDrop = (e: React.DragEvent, insertIndex?: number, targetPageId?: string, insertPositionInPage?: number) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType") as FieldType;
    setHoveredDropIndex(null);
    
    if (fieldType) {
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
      
      // Insert field at the correct position
      let newFields: Field[];
      let globalInsertIndex: number | undefined = insertIndex;
      
      // If multi-page mode, calculate global insert index based on page position
      if (multiStepConfig?.enabled && targetPageId && insertPositionInPage !== undefined) {
        // Find the global index by counting all fields before this position in this page
        const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
        let globalIndex = 0;
        
        // Count actual fields in all pages before the target page
        for (const step of sortedSteps) {
          if (step.id === targetPageId) break;
          // Count only fields that actually exist in the fields array
          const stepFields = step.fieldIds
            .map(id => fields.find(f => f.id === id))
            .filter(Boolean);
          globalIndex += stepFields.length;
        }
        
        // Add the position within the target page
        globalIndex += insertPositionInPage;
        globalInsertIndex = globalIndex;
      }
      
      if (globalInsertIndex !== undefined && globalInsertIndex >= 0) {
        // Insert at specific index
        newFields = [...fields];
        newFields.splice(globalInsertIndex, 0, newField);
        // Update order values
        newFields = newFields.map((field, index) => ({ ...field, order: index }));
      } else {
        // Append to end
        newFields = [...fields, newField];
      }
      
      onFieldsChange(newFields);
      setSelectedFieldId(newField.id);
      
      // If multi-page is enabled, assign field to the target page at the correct position
      if (multiStepConfig?.enabled && targetPageId) {
        const updatedSteps = multiStepConfig.steps.map(step => {
          if (step.id === targetPageId) {
            const newFieldIds = [...step.fieldIds];
            if (insertPositionInPage !== undefined && insertPositionInPage >= 0) {
              // Insert at specific position within the page
              newFieldIds.splice(insertPositionInPage, 0, newField.id);
            } else {
              // Append to end of page
              newFieldIds.push(newField.id);
            }
            return { ...step, fieldIds: newFieldIds };
          }
          return step;
        });
        
        onMultiStepConfigChange({
          ...multiStepConfig,
          steps: updatedSteps,
        });
      } else if (multiStepConfig?.enabled && multiStepConfig.steps.length > 0) {
        // If no target page specified, add to last page
        const sortedSteps = [...multiStepConfig.steps].sort((a, b) => a.order - b.order);
        const lastStep = sortedSteps[sortedSteps.length - 1];
        onMultiStepConfigChange({
          ...multiStepConfig,
          steps: multiStepConfig.steps.map(step =>
            step.id === lastStep.id
              ? { ...step, fieldIds: [...step.fieldIds, newField.id] }
              : step
          ),
        });
      }
    }
  };

  const handleDropZoneDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (index !== undefined) {
      setHoveredDropIndex(index);
    }
  };

  const handleDropZoneDragLeave = () => {
    setHoveredDropIndex(null);
  };

  const handlePreview = () => {
    // Store form data in sessionStorage for the preview page
    const previewData = {
      title: formTitle,
      fields: fields,
      styling: styling,
      multiStepConfig: multiStepConfig,
    };
    sessionStorage.setItem('formPreviewData', JSON.stringify(previewData));
    router.push('/builder/preview');
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar - Simplified Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors z-10 relative flex-shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Form Title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => onFormTitleChange(e.target.value)}
              className="text-lg font-semibold w-full px-2 py-1.5 border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="Form title"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Multi-Page Toggle */}
            <button
              onClick={handleToggleMultiPage}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                multiStepConfig?.enabled
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={multiStepConfig?.enabled ? "Disable Multi-Page" : "Enable Multi-Page"}
            >
              <FileText className="w-4 h-4" />
              <span>Multi-Page</span>
              {multiStepConfig?.enabled && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 rounded">
                  {multiStepConfig.steps.length}
                </span>
              )}
            </button>

            {/* Add Page Button (only show if multi-page enabled) */}
            {multiStepConfig?.enabled && (
              <>
                <button
                  onClick={handleAddPage}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium flex items-center gap-1.5"
                  title="Add Page"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Page</span>
                </button>
                <div className="w-px h-6 bg-gray-200" />
              </>
            )}

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium flex items-center gap-1.5"
              title="Preview Form"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md transition-colors ${
                showSettings
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
            >
              Cancel
            </button>

            {/* Save Button */}
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 border-2 border-white border-opacity-25 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
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
              ) : multiStepConfig?.enabled && multiStepConfig.steps.length > 0 ? (
                // Multi-page mode: show pages visually
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {multiStepConfig.steps.sort((a, b) => a.order - b.order).map((page, pageIndex) => {
                      const pageFields = page.fieldIds
                        .map(id => fields.find(f => f.id === id))
                        .filter(Boolean) as Field[];
                      const isFirst = pageIndex === 0;
                      const isLast = pageIndex === multiStepConfig.steps.length - 1;
                      
                      return (
                        <div key={page.id} className="space-y-4">
                          <PageDivider
                            step={page}
                            pageNumber={pageIndex + 1}
                            isFirst={isFirst}
                            isLast={isLast}
                            onUpdate={(updates) => handleUpdatePage(page.id, updates)}
                            onDelete={() => handleDeletePage(page.id)}
                            onMoveUp={() => handleMovePageUp(page.id)}
                            onMoveDown={() => handleMovePageDown(page.id)}
                            canDelete={multiStepConfig.steps.length > 1}
                          />
                          
                          {/* Fields in this page */}
                          <div className="space-y-4 pl-6">
                            {/* Drop zone for adding fields at the beginning of this page */}
                            <PageDropZone 
                              pageId={page.id} 
                              isEmpty={pageFields.length === 0}
                              onDrop={(e) => handleDropZoneDrop(e, undefined, page.id, 0)}
                              onDragOver={handleDropZoneDragOver}
                              onDragLeave={handleDropZoneDragLeave}
                            />
                            
                            {pageFields.map((field, fieldIndexInPage) => {
                              const globalIndex = fields.findIndex(f => f.id === field.id);
                              return (
                                <div key={field.id}>
                                  <DraggableField
                                    field={field}
                                    index={globalIndex}
                                    isSelected={selectedFieldId === field.id}
                                    styling={styling}
                                    onSelect={() => setSelectedFieldId(field.id)}
                                    onDelete={() => handleFieldDelete(field.id)}
                                    onDuplicate={() => handleFieldDuplicate(field.id)}
                                    onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                                  />
                                  {/* Drop zone after each field */}
                                  <div
                                    className="relative -mb-2"
                                    onDrop={(e) => handleDropZoneDrop(e, undefined, page.id, fieldIndexInPage + 1)}
                                    onDragOver={(e) => handleDropZoneDragOver(e)}
                                    onDragLeave={handleDropZoneDragLeave}
                                  >
                                    <div className="h-4 transition-all duration-200 rounded-lg opacity-30 hover:opacity-100">
                                      <div className="h-full border-2 border-dashed rounded-lg transition-all border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  
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
                </SortableContext>
              ) : (
                // Single-page mode: show fields normally
                <div className="space-y-4">
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {/* Drop zone at the beginning */}
                    <div
                      className="relative -mb-2"
                      onDrop={(e) => handleDropZoneDrop(e, 0)}
                      onDragOver={(e) => handleDropZoneDragOver(e, 0)}
                      onDragLeave={handleDropZoneDragLeave}
                    >
                      <div className={`h-4 transition-all duration-200 rounded-lg ${
                        hoveredDropIndex === 0 ? 'opacity-100' : 'opacity-30'
                      }`}>
                        <div className={`h-full border-2 border-dashed rounded-lg transition-all ${
                          hoveredDropIndex === 0 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50'
                        }`} />
                      </div>
                    </div>

                    {fields.map((field, index) => (
                      <div key={field.id}>
                        <DraggableField
                          field={field}
                          index={index}
                          isSelected={selectedFieldId === field.id}
                          styling={styling}
                          onSelect={() => setSelectedFieldId(field.id)}
                          onDelete={() => handleFieldDelete(field.id)}
                          onDuplicate={() => handleFieldDuplicate(field.id)}
                          onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                        />
                        {/* Drop zone after each field */}
                        <div
                          className="relative -mb-2"
                          onDrop={(e) => handleDropZoneDrop(e, index + 1)}
                          onDragOver={(e) => handleDropZoneDragOver(e, index + 1)}
                          onDragLeave={handleDropZoneDragLeave}
                        >
                          <div className={`h-4 transition-all duration-200 rounded-lg ${
                            hoveredDropIndex === index + 1 ? 'opacity-100' : 'opacity-30'
                          }`}>
                            <div className={`h-full border-2 border-dashed rounded-lg transition-all ${
                              hoveredDropIndex === index + 1 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 bg-gray-50'
                            }`} />
                          </div>
                        </div>
                      </div>
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

        {/* Settings Panel (Right Sidebar) */}
        {showSettings && (
          <div className="absolute inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
            <div className="border-b border-gray-200 px-5 py-3.5 flex items-center justify-between bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Multi-page settings - simple checkboxes */}
              {multiStepConfig?.enabled && (
                <div className="border-t border-gray-200 pt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Multi-Page Settings</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={multiStepConfig.showProgressBar}
                      onChange={(e) =>
                        onMultiStepConfigChange({ ...multiStepConfig, showProgressBar: e.target.checked })
                      }
                      className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    Show progress bar
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={multiStepConfig.allowBackNavigation}
                      onChange={(e) =>
                        onMultiStepConfigChange({ ...multiStepConfig, allowBackNavigation: e.target.checked })
                      }
                      className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    Allow back navigation
                  </label>
                </div>
              )}
              <NotificationSettings
                config={notifications}
                onChange={onNotificationsChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

