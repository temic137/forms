"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Field, FieldType, FormStyling, NotificationConfig, MultiStepConfig, FormStep, QuizModeConfig } from "@/types/form";
import FieldPalette, { fieldTemplates } from "./FieldPalette";
import DraggableField from "./DraggableField";
import FieldRenderer from "./FieldRenderer";
import NotificationSettings from "./NotificationSettings";
import QuizSettings from "./QuizSettings";
import StyleEditor from "./StyleEditor";
import { Settings, Save, Eye, FileText, Plus, ArrowLeft, Menu, X, MoreVertical, HelpCircle, Layout, Bell, Palette, GraduationCap, Users, ArrowUp, CalendarClock, History, PlayCircle, Clock } from "lucide-react";
import PageDivider from "./PageDivider";
import PageDropZone from "./PageDropZone";
import ShareCollaboratorButton from "./ShareCollaboratorButton";
import CollaboratorModal from "./CollaboratorModal";
import BuilderOnboarding from "./BuilderOnboarding";
import { Spinner } from "@/components/ui/Spinner";
import { SingleAIButton } from "./InlineAIButton";

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

  // Scheduling Props
  closesAt?: string;
  opensAt?: string;
  isClosed?: boolean;
  closedMessage?: string;
  onClosesAtChange?: (date: string | undefined) => void;
  onOpensAtChange?: (date: string | undefined) => void;
  onIsClosedChange?: (closed: boolean) => void;
  onClosedMessageChange?: (message: string) => void;

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
  // Scheduling props
  closesAt,
  opensAt,
  isClosed,
  closedMessage,
  onClosesAtChange,
  onOpensAtChange,
  onIsClosedChange,
  onClosedMessageChange,
}: DragDropFormBuilderProps) {
  const router = useRouter();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFieldPalette, setShowFieldPalette] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [hoveredDropIndex, setHoveredDropIndex] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'notifications' | 'styling' | 'quiz'>('general');
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      if (canvasRef.current) {
        setShowScrollTop(canvasRef.current.scrollTop > 300);
      }
    };
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('scroll', handleScroll);
      return () => canvas.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // AI suggestion states
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<Array<{
    label: string;
    type: string;
    reason?: string;
    options?: string[];
  }>>([]);

  // Local state for scheduling to handle timezone conversion
  const [localClosesAt, setLocalClosesAt] = useState<string>("");
  const [localOpensAt, setLocalOpensAt] = useState<string>("");

  useEffect(() => {
    // Sync local state with props when they change (convert UTC to local for input)
    if (closesAt) {
      const date = new Date(closesAt);
      // Format for datetime-local input: YYYY-MM-DDThh:mm
      const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setLocalClosesAt(localIso);
    } else {
      setLocalClosesAt("");
    }
  }, [closesAt]);

  useEffect(() => {
    // Sync local state with props when they change
    if (opensAt) {
      const date = new Date(opensAt);
      const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setLocalOpensAt(localIso);
    } else {
      setLocalOpensAt("");
    }
  }, [opensAt]);

  const handleClosesAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalClosesAt(value);
    if (!value) {
      onClosesAtChange?.(undefined);
    } else {
      onClosesAtChange?.(new Date(value).toISOString());
    }
  };

  const handleOpensAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalOpensAt(value);
    if (!value) {
      onOpensAtChange?.(undefined);
    } else {
      onOpensAtChange?.(new Date(value).toISOString());
    }
  };

  // Handler for AI follow-up suggestions
  const handleFollowUpAIResult = (data: Record<string, unknown>) => {
    if (data.suggestions) {
      const suggestions = data.suggestions as Array<{
        label: string;
        type: string;
        reason?: string;
        options?: string[];
      }>;
      setAISuggestions(suggestions);
      setShowAISuggestions(true);
    }
  };

  // Create a field from AI suggestion
  const handleSelectAISuggestion = (suggestion: { label: string; type: string; options?: string[] }) => {
    const fieldType = suggestion.type as FieldType;
    const newField: Field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: suggestion.label,
      required: false,
      placeholder: "",
      options: suggestion.options,
      order: fields.length,
      conditionalLogic: [],
      color: "#ffffff",
    };

    const newFields = [...fields, newField];
    onFieldsChange(newFields);
    setSelectedFieldId(newField.id);
    setShowAISuggestions(false);
    setAISuggestions([]);

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

  // Get context for AI suggestions based on last field
  const getAIContextForSuggestions = () => {
    const lastField = fields[fields.length - 1];
    return {
      fieldLabel: lastField?.label || "",
      fieldType: lastField?.type || "",
      formTitle: formTitle,
      formContext: formTitle,
      otherFields: fields.map(f => ({ label: f.label, type: f.type })),
    };
  };

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
      quizMode: quizMode,
      notifications: notifications,
      limitOneResponse: limitOneResponse,
      saveAndEdit: saveAndEdit,
      conversationalMode: false, // Preview always shows standard mode
      closesAt: closesAt,
      opensAt: opensAt,
      isClosed: isClosed,
      closedMessage: closedMessage,
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
    <div className="flex h-screen bg-paper-texture font-paper text-black overflow-hidden text-sm">
      {currentFormId && (
        <CollaboratorModal
          formId={currentFormId}
          isOpen={showCollaboratorModal}
          onClose={() => setShowCollaboratorModal(false)}
        />
      )}
      <BuilderOnboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      {/* Left Sidebar - Field Palette & Theme Settings */}
      {/* Mobile backdrop */}
      {showFieldPalette && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
          onClick={() => setShowFieldPalette(false)}
        />
      )}

      {/* Sidebar - slides in on mobile, always visible on desktop */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300 lg:transform-none ${showFieldPalette ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Close button for mobile */}
        <button
          onClick={() => setShowFieldPalette(false)}
          className="lg:hidden absolute top-4 right-4 z-10 p-2 bg-white rounded-full border border-black/10 text-black hover:bg-gray-50"
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
        <div className="border-b border-black/10 bg-white/80 px-2 sm:px-3 py-1.5 sm:py-2">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex h-8 items-center justify-center gap-1 rounded-full border border-black/10 px-2 text-black transition-colors hover:bg-black/5"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Back</span>
            </button>

            {/* Status Badge (Mobile) */}
            {isClosed && (
              <div className="px-2 py-0.5 bg-transparent border border-black/20 text-black text-[10px] font-bold rounded-full flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Closed</span>
              </div>
            )}


            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                className="w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-sm font-bold text-black placeholder:text-black/40 focus:border-black/30 focus:outline-none focus:ring-0"
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
              className="flex items-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-xs font-bold text-black transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Spinner size="sm" variant="primary" />
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black transition-colors hover:bg-black/5"
              title="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex w-full items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors z-10 relative shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* Status Indicators (Desktop) */}
            {isClosed && (
              <div className="px-2 py-0.5 border border-black/20 text-black text-[10px] font-bold rounded-full flex items-center gap-1 animate-in fade-in">
                <History className="w-3 h-3" />
                <span>Closed</span>
              </div>
            )}
            {!isClosed && opensAt && new Date(opensAt) > new Date() && (
              <div className="px-2 py-0.5 border border-black/20 text-black text-[10px] font-bold rounded-full flex items-center gap-1 animate-in fade-in">
                <Clock className="w-3 h-3" />
                <span>Scheduled</span>
              </div>
            )}
            {/* Reopen Quick Action */}
            {isClosed && (
              <button
                onClick={() => onIsClosedChange?.(false)}
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 border border-black/20 hover:bg-black/5 rounded-full text-[10px] font-bold transition-colors"
              >
                <PlayCircle className="w-3 h-3" />
                Reopen Form
              </button>
            )}

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                className="text-base font-bold w-full px-2 py-1 border-0 focus:outline-none focus:ring-0 bg-transparent text-black placeholder:text-black/40"
                placeholder="Form title"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowFieldPalette(true)}
                className="lg:hidden p-1.5 text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors"
                title="Add Fields"
              >
                <Menu className="w-4 h-4" />
              </button>

              {multiStepConfig?.enabled && (
                <>
                  <button
                    onClick={handleAddPage}
                    className="hidden sm:flex px-2.5 py-1 text-xs text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors font-bold items-center gap-1"
                    title="Add Page"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Page</span>
                  </button>
                  <div className="hidden sm:block w-px h-4 bg-black/10" />
                </>
              )}

              <button
                onClick={handlePreview}
                className="hidden sm:flex px-2.5 py-1 text-xs text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors font-bold items-center gap-1"
                title="Preview Form"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <div className="hidden sm:block w-px h-4 bg-black/10" />

              {currentFormId && (
                <>
                  <ShareCollaboratorButton formId={currentFormId} />
                  <div className="hidden sm:block w-px h-4 bg-black/10" />
                </>
              )}

              <button
                onClick={() => setShowOnboarding(true)}
                className="hidden sm:flex px-2.5 py-1 text-xs text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors font-bold items-center gap-1"
                title="Help & Tour"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </button>

              <div className="hidden sm:block w-px h-4 bg-black/10" />

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-full border border-black/10 transition-colors ${showSettings
                  ? "bg-black/5 text-black"
                  : "text-black hover:bg-black/5"
                  }`}
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              <div className="hidden sm:block w-px h-4 bg-black/10" />

              <button
                onClick={onCancel}
                className="hidden sm:block px-2.5 py-1 text-xs text-black hover:bg-black/5 rounded-full border border-black/10 transition-colors font-bold"
              >
                Cancel
              </button>

              <button
                onClick={onSave}
                disabled={saving}
                className="px-3 py-1 text-xs bg-white text-black border border-black/20 rounded-full hover:bg-black/5 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" variant="primary" className="w-3 h-3" />
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
              className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Form Actions</span>
                <button
                  onClick={() => setShowMobileActions(false)}
                  className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto">
                <button
                  onClick={() => {
                    setShowMobileActions(false);
                    setShowFieldPalette(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                    <Menu className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Add Fields</div>
                    <div className="text-xs text-gray-500">Open field library</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMobileActions(false);
                    handlePreview();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Preview</div>
                    <div className="text-xs text-gray-500">Test your form</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMobileActions(false);
                    setShowSettings(true);
                    setActiveSettingsTab('general');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Settings</div>
                    <div className="text-xs text-gray-500">General, Styling, Logic</div>
                  </div>
                </button>

                {multiStepConfig?.enabled && (
                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      handleAddPage();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Add Page</div>
                      <div className="text-xs text-gray-500">Create new step</div>
                    </div>
                  </button>
                )}

                {currentFormId && (
                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      setShowCollaboratorModal(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Collaborate</div>
                      <div className="text-xs text-gray-500">Invite team members</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMobileActions(false);
                    setShowOnboarding(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-black">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Help & Tour</div>
                    <div className="text-xs text-gray-500">View guide</div>
                  </div>
                </button>


              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div
          ref={canvasRef}
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
                  className="border border-dashed border-gray-300 rounded-lg p-12 text-center bg-white hover:border-gray-400 transition-colors"
                  onDrop={handleDropZoneDrop}
                  onDragOver={handleDropZoneDragOver}
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Form</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                      Drag fields from the left sidebar or click below to get started.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => handleFieldSelect("short-answer")}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>📝</span> Short Answer
                      </button>
                      <button
                        onClick={() => handleFieldSelect("multiple-choice")}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>⭕</span> Multiple Choice
                      </button>
                      <button
                        onClick={() => handleFieldSelect("email")}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
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

                    {/* Add Field Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFieldSelect("short-answer")}
                        className="flex-1 py-3 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Field
                        </div>
                      </button>
                      {/* AI Suggest Field Button */}
                      {fields.length > 0 && (
                        <SingleAIButton
                          action="suggest-follow-up"
                          context={getAIContextForSuggestions()}
                          onResult={handleFollowUpAIResult}
                          label="✨ AI Suggest"
                          className="py-4 px-4 rounded-xl text-sm"
                        />
                      )}
                    </div>
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
                      <div className={`h-4 transition-all duration-200 rounded-lg ${hoveredDropIndex === 0 ? 'opacity-100' : 'opacity-30'
                        }`}>
                        <div className={`h-full border-2 border-dashed rounded-lg transition-all ${hoveredDropIndex === 0
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
                          <div className={`h-4 transition-all duration-200 rounded-lg ${hoveredDropIndex === index + 1 ? 'opacity-100' : 'opacity-30'
                            }`}>
                            <div className={`h-full border-2 border-dashed rounded-lg transition-all ${hoveredDropIndex === index + 1
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 bg-gray-50'
                              }`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </SortableContext>

                  {/* Add Field Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFieldSelect("short-answer")}
                      className="flex-1 py-3 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Field
                      </div>
                    </button>
                    {/* AI Suggest Field Button */}
                    {fields.length > 0 && (
                      <SingleAIButton
                        action="suggest-follow-up"
                        context={getAIContextForSuggestions()}
                        onResult={handleFollowUpAIResult}
                        label="✨ AI Suggest"
                        className="py-4 px-4 rounded-xl text-sm"
                      />
                    )}
                  </div>
                </div>
              )}

              <DragOverlay>
                {activeId ? (
                  <div className="bg-white border border-gray-300 rounded-lg p-4 opacity-95">
                    <FieldRenderer field={fields.find(f => f.id === activeId)!} styling={styling} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={() => {
              canvasRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-6 right-6 z-30 p-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all animate-in fade-in duration-200"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* Settings Panel (Right Sidebar on desktop, modal on mobile) */}
        {showSettings && (
          <>
            {/* Mobile backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSettings(false)}
            />

            <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-gray-200 z-50 flex flex-col">
              <div className="border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
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
              <div className="flex flex-col h-full bg-white">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveSettingsTab('general')}
                    className={`flex-1 min-w-[80px] px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${activeSettingsTab === 'general'
                      ? 'text-black bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Settings className="w-4 h-4" />
                      <span>General</span>
                    </div>
                    {activeSettingsTab === 'general' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('styling')}
                    className={`flex-1 min-w-[80px] px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${activeSettingsTab === 'styling'
                      ? 'text-black bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Palette className="w-4 h-4" />
                      <span>Styling</span>
                    </div>
                    {activeSettingsTab === 'styling' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('notifications')}
                    className={`flex-1 min-w-[80px] px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${activeSettingsTab === 'notifications'
                      ? 'text-black bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Bell className="w-4 h-4" />
                      <span>Notify</span>
                    </div>
                    {activeSettingsTab === 'notifications' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </button>

                  {onQuizModeChange && (
                    <button
                      onClick={() => setActiveSettingsTab('quiz')}
                      className={`flex-1 min-w-[80px] px-3 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${activeSettingsTab === 'quiz'
                        ? 'text-black bg-white'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        <span>Quiz</span>
                      </div>
                      {activeSettingsTab === 'quiz' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                      )}
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* General Tab */}
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Multi-page settings */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Layout className="w-4 h-4" />
                          Multi-Page Settings
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700 font-medium cursor-pointer" htmlFor="enable-multipage">
                              Enable Multi-Page Mode
                            </label>
                            <button
                              id="enable-multipage"
                              role="switch"
                              aria-checked={multiStepConfig?.enabled || false}
                              onClick={handleToggleMultiPage}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${multiStepConfig?.enabled ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${multiStepConfig?.enabled ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>

                          {multiStepConfig?.enabled && (
                            <div className="pt-2 space-y-3 border-t border-gray-200 mt-2">
                              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={multiStepConfig.showProgressBar}
                                  onChange={(e) =>
                                    onMultiStepConfigChange({ ...multiStepConfig, showProgressBar: e.target.checked })
                                  }
                                  className="w-4 h-4 border-gray-300 text-black focus:ring-black rounded"
                                />
                                Show progress bar
                              </label>
                              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={multiStepConfig.allowBackNavigation}
                                  onChange={(e) =>
                                    onMultiStepConfigChange({ ...multiStepConfig, allowBackNavigation: e.target.checked })
                                  }
                                  className="w-4 h-4 border-gray-300 text-black focus:ring-black rounded"
                                />
                                Allow back navigation
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scheduling Settings */}
                      {(onClosesAtChange || onIsClosedChange) && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            Scheduling & Access
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                            {/* Manual Close */}
                            {onIsClosedChange && (
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-700 font-medium cursor-pointer" htmlFor="close-form-toggle">
                                  Close Form Manually
                                </label>
                                <button
                                  id="close-form-toggle"
                                  role="switch"
                                  aria-checked={isClosed || false}
                                  onClick={() => onIsClosedChange(!isClosed)}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${isClosed ? 'bg-red-500' : 'bg-gray-200'}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isClosed ? 'translate-x-4' : 'translate-x-0'}`}
                                  />
                                </button>
                              </div>
                            )}

                            {/* Schedule Open */}
                            {onOpensAtChange && (
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Schedule Open Date
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="datetime-local"
                                    value={localOpensAt}
                                    onChange={handleOpensAtChange}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                  />
                                  {localOpensAt && (
                                    <button
                                      onClick={() => {
                                        setLocalOpensAt("");
                                        onOpensAtChange(undefined);
                                      }}
                                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-md"
                                      title="Clear"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Form will be closed until this time.
                                </p>
                              </div>
                            )}

                            {/* Schedule Close */}
                            {onClosesAtChange && (
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Schedule Auto-Close
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="datetime-local"
                                    value={localClosesAt}
                                    onChange={handleClosesAtChange}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                  />
                                  {localClosesAt && (
                                    <button
                                      onClick={() => {
                                        setLocalClosesAt("");
                                        onClosesAtChange(undefined);
                                      }}
                                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-md"
                                      title="Clear"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Form will automatically close at this time.
                                </p>
                              </div>
                            )}

                            {/* Closed Message */}
                            {onClosedMessageChange && (
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <label htmlFor="closed-message" className="block text-sm font-medium text-gray-700 mb-1">
                                  Closed Form Message
                                </label>
                                <textarea
                                  id="closed-message"
                                  value={closedMessage || ""}
                                  onChange={(e) => onClosedMessageChange(e.target.value)}
                                  rows={3}
                                  maxLength={200}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                                  placeholder="This form is no longer accepting responses."
                                />
                                <div className="flex justify-end">
                                  <span className="text-xs text-gray-500">
                                    {(closedMessage || "").length}/200
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display Settings */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          Display Settings
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm text-gray-700 font-medium cursor-pointer" htmlFor="show-field-numbers">
                                Number Fields
                              </label>
                              <p className="text-xs text-gray-500 mt-0.5">Show numbers before field labels (1., 2., 3.)</p>
                            </div>
                            <button
                              id="show-field-numbers"
                              role="switch"
                              aria-checked={styling?.showFieldNumbers || false}
                              onClick={() => {
                                const newStyling = {
                                  ...styling,
                                  primaryColor: styling?.primaryColor || '#3b82f6',
                                  backgroundColor: styling?.backgroundColor || '#f3f4f6',
                                  buttonColor: styling?.buttonColor || '#000000',
                                  buttonTextColor: styling?.buttonTextColor || '#ffffff',
                                  fontFamily: styling?.fontFamily || 'system',
                                  buttonRadius: styling?.buttonRadius || 8,
                                  showFieldNumbers: !styling?.showFieldNumbers,
                                } as FormStyling;
                                onStylingChange(newStyling);
                              }}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${styling?.showFieldNumbers ? 'bg-black' : 'bg-gray-200'}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${styling?.showFieldNumbers ? 'translate-x-4' : 'translate-x-0'}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submission Settings */}
                      {(onLimitOneResponseChange || onSaveAndEditChange) && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submission Logic
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                            {onLimitOneResponseChange && (
                              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={limitOneResponse || false}
                                  onChange={(e) => onLimitOneResponseChange(e.target.checked)}
                                  className="w-4 h-4 border-gray-300 text-black focus:ring-black rounded"
                                />
                                Limit to 1 response per person
                              </label>
                            )}
                            {onSaveAndEditChange && (
                              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={saveAndEdit || false}
                                  onChange={(e) => onSaveAndEditChange(e.target.checked)}
                                  className="w-4 h-4 border-gray-300 text-black focus:ring-black rounded"
                                />
                                Allow editing after submission
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Styling Tab */}
                  {activeSettingsTab === 'styling' && (
                    <div className="animate-in fade-in duration-200">
                      {onStylingChange && (
                        <div className="-mt-2">
                          <StyleEditor
                            styling={styling}
                            onChange={onStylingChange}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeSettingsTab === 'notifications' && (
                    <div className="animate-in fade-in duration-200">
                      <NotificationSettings
                        config={notifications}
                        onChange={onNotificationsChange}
                      />
                    </div>
                  )}

                  {/* Quiz Tab */}
                  {activeSettingsTab === 'quiz' && onQuizModeChange && (
                    <div className="animate-in fade-in duration-200">
                      <QuizSettings
                        config={quizMode}
                        onChange={onQuizModeChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Suggestions Modal for Follow-up Questions */}
      {
        showAISuggestions && aiSuggestions.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => {
              setShowAISuggestions(false);
              setAISuggestions([]);
            }}
          >
            <div
              className="w-full max-w-md mx-4 bg-white rounded-lg border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Suggested Questions</h3>
                      <p className="text-xs text-gray-500">Click to add to your form</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAISuggestions(false);
                      setAISuggestions([]);
                    }}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAISuggestion(suggestion)}
                      className="w-full text-left p-4 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{suggestion.label}</p>
                          {suggestion.reason && (
                            <p className="mt-1 text-xs text-gray-500">{suggestion.reason}</p>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {suggestion.type}
                        </span>
                      </div>
                      {suggestion.options && suggestion.options.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {suggestion.options.slice(0, 3).map((opt, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {opt}
                            </span>
                          ))}
                          {suggestion.options.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{suggestion.options.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowAISuggestions(false);
                    setAISuggestions([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

