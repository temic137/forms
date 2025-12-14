"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, DragOverEvent, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { Field, FieldType, FormStyling, NotificationConfig, MultiStepConfig, FormStep, QuizModeConfig } from "@/types/form";
import FieldPalette, { fieldTemplates } from "./FieldPalette";
import DraggableField from "./DraggableField";
import FieldRenderer from "./FieldRenderer";
import NotificationSettings from "./NotificationSettings";
import GoogleSheetsIntegration from "@/components/GoogleSheetsIntegration";
import QuizSettings from "./QuizSettings";
import { Settings, Save, Eye, FileText, Plus, ArrowLeft, Menu, X, MoreVertical, HelpCircle } from "lucide-react";
import PageDivider from "./PageDivider";
import PageDropZone from "./PageDropZone";
import ShareCollaboratorButton from "./ShareCollaboratorButton";
import BuilderOnboarding from "./BuilderOnboarding";

interface DragDropFormBuilderProps {
  formTitle: string;
  fields: Field[];
  styling?: FormStyling;
  notifications?: NotificationConfig;
  multiStepConfig?: MultiStepConfig;
  quizMode?: QuizModeConfig;
  limitOneResponse?: boolean;
  saveAndEdit?: boolean;
  currentFormId?: string | null;
  onFormTitleChange: (title: string) => void;
  onFieldsChange: (fields: Field[]) => void;
  onStylingChange: (styling: FormStyling | undefined) => void;
  onNotificationsChange: (notifications: NotificationConfig | undefined) => void;
  onMultiStepConfigChange: (config: MultiStepConfig | undefined) => void;
  onQuizModeChange?: (config: QuizModeConfig | undefined) => void;
  onLimitOneResponseChange?: (enabled: boolean) => void;
  onSaveAndEditChange?: (enabled: boolean) => void;
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
  quizMode,
  limitOneResponse,
  saveAndEdit,
  onFormTitleChange,
  onFieldsChange,
  onStylingChange,
  onNotificationsChange,
  onMultiStepConfigChange,
  onQuizModeChange,
  onLimitOneResponseChange,
  onSaveAndEditChange,
  onSave,
  onCancel,
  saving = false,
  currentFormId,
}: DragDropFormBuilderProps) {
  const router = useRouter();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFieldPalette, setShowFieldPalette] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [hoveredDropIndex, setHoveredDropIndex] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenBuilderOnboarding");
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("hasSeenBuilderOnboarding", "true");
    setShowOnboarding(false);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
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
      fileConfig: (fieldType === "file" || fieldType === "file-uploader") ? {
        acceptedTypes: "all",
        maxSizeMB: 10,
        multiple: false
      } : undefined,
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
        fileConfig: (fieldType === "file" || fieldType === "file-uploader") ? {
          acceptedTypes: "all",
          maxSizeMB: 10,
          multiple: false
        } : undefined,
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
    if (currentFormId) {
      sessionStorage.setItem('formPreviewEditingFormId', currentFormId);
    } else {
      sessionStorage.setItem('formPreviewEditingFormId', 'new');
    }
    router.push('/builder/preview');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <BuilderOnboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      {/* Left Sidebar - Field Palette & Theme Settings */}
      {/* Mobile backdrop */}
      {showFieldPalette && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFieldPalette(false)}
        />
      )}
      
      {/* Sidebar - slides in on mobile, always visible on desktop */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300 lg:transform-none ${
        showFieldPalette ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Close button for mobile */}
        <button
          onClick={() => setShowFieldPalette(false)}
          className="lg:hidden absolute top-4 right-4 z-10 p-2 bg-white rounded-md shadow-lg text-gray-600 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>
        
        <FieldPalette 
          onFieldSelect={(fieldType) => {
            handleFieldSelect(fieldType);
            setShowFieldPalette(false); // Close on mobile after selection
          }}
          styling={styling}
          onStylingChange={onStylingChange}
        />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Form title"
              />
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!saving) {
                  onSave();
                }
              }}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="relative h-4 w-4">
                    <div className="absolute inset-0 rounded-full border-2 border-white border-opacity-25"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  </div>
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMobileActions(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex w-full items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors z-10 relative shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                className="text-base sm:text-lg font-semibold w-full px-2 py-1.5 border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Form title"
              />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowFieldPalette(true)}
                className="lg:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                title="Add Fields"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleToggleMultiPage}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors font-medium flex items-center gap-1 sm:gap-1.5 ${
                  multiStepConfig?.enabled
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                title={multiStepConfig?.enabled ? "Disable Multi-Page" : "Enable Multi-Page"}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Multi-Page</span>
                {multiStepConfig?.enabled && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 rounded">
                    {multiStepConfig.steps.length}
                  </span>
                )}
              </button>

              {multiStepConfig?.enabled && (
                <>
                  <button
                    onClick={handleAddPage}
                    className="hidden sm:flex px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium items-center gap-1.5"
                    title="Add Page"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Page</span>
                  </button>
                  <div className="hidden sm:block w-px h-6 bg-gray-200" />
                </>
              )}

              <button
                onClick={handlePreview}
                className="hidden sm:flex px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium items-center gap-1.5"
                title="Preview Form"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <div className="hidden sm:block w-px h-6 bg-gray-200" />

              {currentFormId && (
                <>
                  <ShareCollaboratorButton formId={currentFormId} />
                  <div className="hidden sm:block w-px h-6 bg-gray-200" />
                </>
              )}

              <button
                onClick={() => setShowOnboarding(true)}
                className="hidden sm:flex px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium items-center gap-1.5"
                title="Help & Tour"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </button>

              <div className="hidden sm:block w-px h-6 bg-gray-200" />

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  showSettings
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="hidden sm:block w-px h-6 bg-gray-200" />

              <button
                onClick={onCancel}
                className="hidden sm:block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
              >
                Cancel
              </button>

              <button
                onClick={onSave}
                disabled={saving}
                className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <div className="relative w-3.5 h-3.5">
                      <div className="absolute inset-0 border-2 border-white border-opacity-25 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <span className="hidden sm:inline">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {showMobileActions && (
          <div className="sm:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileActions(false)}
            />
            <div
              className="absolute inset-x-0 bottom-0 space-y-3 rounded-t-2xl bg-white p-4 pb-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Quick actions</span>
                <button
                  type="button"
                  onClick={() => setShowMobileActions(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    setShowFieldPalette(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <Menu className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Add fields</p>
                    <p className="text-xs text-gray-500">Open the field library</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    handlePreview();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <Eye className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Preview form</p>
                    <p className="text-xs text-gray-500">Open a live preview</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    handleToggleMultiPage();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Multi-page mode</p>
                    <p className="text-xs text-gray-500">
                      {multiStepConfig?.enabled ? "Currently enabled" : "Currently disabled"}
                    </p>
                  </div>
                </button>

                {multiStepConfig?.enabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileActions(false);
                      handleAddPage();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                      <Plus className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Add page</p>
                      <p className="text-xs text-gray-500">Insert a new step</p>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    setShowSettings((prev) => !prev);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <Settings className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Form settings</p>
                    <p className="text-xs text-gray-500">
                      {showSettings ? "Hide settings panel" : "Show settings panel"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    onCancel();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Back to dashboard</p>
                    <p className="text-xs text-gray-500">Leave without saving</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      onSave();
                    }
                    setShowMobileActions(false);
                  }}
                  disabled={saving}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-white">
                    {saving ? (
                      <div className="relative h-4 w-4">
                        <div className="absolute inset-0 rounded-full border-2 border-white border-opacity-25"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Save changes</p>
                    <p className="text-xs text-gray-500">Apply your latest edits</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8"
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
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center bg-white shadow-sm hover:border-blue-400 transition-colors"
                  onDrop={handleDropZoneDrop}
                  onDragOver={handleDropZoneDragOver}
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                      <Plus className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Building Your Form</h3>
                    <p className="text-gray-600 mb-8 text-base">
                      Drag fields from the left sidebar or click the buttons below to get started quickly.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => handleFieldSelect("short-answer")}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                      >
                        <span>📝</span> Short Answer
                      </button>
                      <button
                        onClick={() => handleFieldSelect("multiple-choice")}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                      >
                        <span>⭕</span> Multiple Choice
                      </button>
                      <button
                        onClick={() => handleFieldSelect("email")}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                      >
                        <span>📧</span> Email
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
                                    isQuizMode={quizMode?.enabled}
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
                          isQuizMode={quizMode?.enabled}
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

        {/* Settings Panel (Right Sidebar on desktop, modal on mobile) */}
        {showSettings && (
          <>
            {/* Mobile backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSettings(false)}
            />
            
            <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
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
                {/* Quiz Mode Settings */}
                {onQuizModeChange && (
                  <QuizSettings
                    config={quizMode}
                    onChange={onQuizModeChange}
                  />
                )}

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
                
                {/* Submission Settings */}
                {(onLimitOneResponseChange || onSaveAndEditChange) && (
                  <div className="border-t border-gray-200 pt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Submission Settings</h3>
                    {onLimitOneResponseChange && (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={limitOneResponse || false}
                          onChange={(e) => onLimitOneResponseChange(e.target.checked)}
                          className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        Limit to 1 Response per person
                      </label>
                    )}
                    {onSaveAndEditChange && (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAndEdit || false}
                          onChange={(e) => onSaveAndEditChange(e.target.checked)}
                          className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        Allow editing after submission (via email link)
                      </label>
                    )}
                  </div>
                )}

                <NotificationSettings
                  config={notifications}
                  onChange={onNotificationsChange}
                />
{/* 
                {currentFormId && (
                  <div className="border-t border-gray-200 pt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
                    <div className="p-1">
                      <GoogleSheetsIntegration formId={currentFormId} />
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

