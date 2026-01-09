"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Field, FieldType, QuizConfig } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";
import { 
  Send, 
  Trash2, 
  Plus, 
  Edit2, 
  Sparkles, 
  Undo2, 
  Redo2, 
  MousePointer2, 
  GraduationCap, 
  X, 
  Check,
  History,
  Target,
  Zap,
  ChevronUp,
  Award,
  HelpCircle
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modifications?: FieldModification[];
  timestamp: Date;
}

interface FieldModification {
  action: "add" | "update" | "delete" | "reorder" | "quiz-config";
  fieldId?: string;
  field?: Partial<Field>;
  insertIndex?: number; // For add - where to insert the new field
  newIndex?: number; // For reorder
  quizConfig?: QuizConfig;
}

interface FormContext {
  title: string;
  fields: Field[];
  selectedFieldId?: string;
}

// History state for undo/redo
interface HistoryState {
  fields: Field[];
  formTitle: string;
  timestamp: Date;
  description?: string; // Description of what changed
}

interface InlineAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  onFormTitleChange: (title: string) => void;
  selectedFieldId?: string;
  onFieldSelect?: (fieldId: string | null) => void;
  highlightedFieldId?: string;
  onHighlightField?: (fieldId: string | null) => void;
  quizModeEnabled?: boolean;
}

export default function InlineAIChat({
  isOpen,
  onClose,
  formTitle,
  fields,
  onFieldsChange,
  onFormTitleChange,
  selectedFieldId,
  onFieldSelect,
  onHighlightField,
  quizModeEnabled = false,
}: InlineAIChatProps) {
  // highlightedFieldId is passed but handled externally via onHighlightField callbacks
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showQuizQuickActions, setShowQuizQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // History for undo/redo functionality
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const [lastChangeDescription, setLastChangeDescription] = useState<string>("");

  // Track the last AI modification for better undo descriptions
  const [pendingDescription, setPendingDescription] = useState<string>("");

  // Save current state to history when fields or title change (but not during undo/redo)
  useEffect(() => {
    if (isUndoRedo) {
      setIsUndoRedo(false);
      return;
    }
    // Only save if there are meaningful changes
    const currentState: HistoryState = {
      fields: [...fields],
      formTitle,
      timestamp: new Date(),
      description: pendingDescription || generateChangeDescription(history[historyIndex]?.fields || [], fields, history[historyIndex]?.formTitle || "", formTitle),
    };
    
    // Use refs to avoid stale closure issues
    setHistory(prevHistory => {
      // Check if this is actually a new state (not a duplicate)
      if (prevHistory.length > 0) {
        const lastState = prevHistory[prevHistory.length - 1];
        if (lastState && 
            JSON.stringify(lastState.fields) === JSON.stringify(fields) && 
            lastState.formTitle === formTitle) {
          return prevHistory; // No change, don't save
        }
      }
      
      const newHistory = [...prevHistory, currentState];
      
      // Keep max 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
    setPendingDescription(""); // Clear pending description after saving
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, formTitle]);

  // Generate a human-readable description of what changed
  const generateChangeDescription = (oldFields: Field[], newFields: Field[], oldTitle: string, newTitle: string): string => {
    if (oldTitle !== newTitle) {
      return `Changed title to "${newTitle}"`;
    }
    
    const oldCount = oldFields.length;
    const newCount = newFields.length;
    
    if (newCount > oldCount) {
      const addedField = newFields[newFields.length - 1];
      return `Added "${addedField?.label || "field"}"`;
    }
    
    if (newCount < oldCount) {
      return `Removed a field`;
    }
    
    // Check for updates
    for (let i = 0; i < newFields.length; i++) {
      if (JSON.stringify(oldFields[i]) !== JSON.stringify(newFields[i])) {
        return `Updated "${newFields[i]?.label || "field"}"`;
      }
    }
    
    return "Modified form";
  };

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const previousState = history[historyIndex - 1];
      const currentState = history[historyIndex];
      setHistoryIndex(historyIndex - 1);
      onFieldsChange(previousState.fields);
      onFormTitleChange(previousState.formTitle);
      setLastChangeDescription(`Undid: ${currentState?.description || "last change"}`);
      
      // Clear the feedback after 3 seconds
      setTimeout(() => setLastChangeDescription(""), 3000);
    }
  }, [historyIndex, history, onFieldsChange, onFormTitleChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onFieldsChange(nextState.fields);
      onFormTitleChange(nextState.formTitle);
      setLastChangeDescription(`Redid: ${nextState?.description || "change"}`);
      
      // Clear the feedback after 3 seconds
      setTimeout(() => setLastChangeDescription(""), 3000);
    }
  }, [historyIndex, history, onFieldsChange, onFormTitleChange]);

  // Jump to specific history state
  const jumpToHistoryState = useCallback((index: number) => {
    if (index >= 0 && index < history.length && index !== historyIndex) {
      setIsUndoRedo(true);
      const targetState = history[index];
      setHistoryIndex(index);
      onFieldsChange(targetState.fields);
      onFormTitleChange(targetState.formTitle);
      setLastChangeDescription(`Restored: ${targetState?.description || "state"}`);
      setShowHistoryPanel(false);
      
      // Clear the feedback after 3 seconds
      setTimeout(() => setLastChangeDescription(""), 3000);
    }
  }, [historyIndex, history, onFieldsChange, onFormTitleChange]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const applyModifications = useCallback((modifications: FieldModification[], newTitle?: string) => {
    let updatedFields = [...fields];
    const changeDescriptions: string[] = [];

    for (const mod of modifications) {
      switch (mod.action) {
        case "add":
          if (mod.field) {
            const newField: Field = {
              id: mod.field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              label: mod.field.label || "New Field",
              type: (mod.field.type as FieldType) || "short-answer",
              required: mod.field.required || false,
              placeholder: mod.field.placeholder || "",
              helpText: mod.field.helpText || "",
              options: mod.field.options,
              order: updatedFields.length,
              conditionalLogic: [],
              color: "#ffffff",
              quizConfig: mod.field.quizConfig,
            };
            
            // Check if insertIndex is specified for positional insert
            if (typeof mod.insertIndex === "number") {
              // Insert at specific position
              const insertPos = Math.max(0, Math.min(mod.insertIndex, updatedFields.length));
              updatedFields.splice(insertPos, 0, newField);
              const positionDesc = insertPos === 0 ? "at the beginning" : 
                                   insertPos >= updatedFields.length - 1 ? "at the end" : 
                                   `at position ${insertPos + 1}`;
              changeDescriptions.push(`Added "${mod.field.label || "field"}" ${positionDesc}`);
            } else {
              // Add to end (default behavior)
              updatedFields.push(newField);
              changeDescriptions.push(`Added "${mod.field.label || "field"}"`);
            }
          }
          break;

        case "update":
          if (mod.fieldId && mod.field) {
            const fieldToUpdate = updatedFields.find(f => f.id === mod.fieldId);
            updatedFields = updatedFields.map(f => {
              if (f.id === mod.fieldId) {
                return { ...f, ...mod.field };
              }
              return f;
            });
            changeDescriptions.push(`Updated "${fieldToUpdate?.label || "field"}"`);
          }
          break;

        case "delete":
          if (mod.fieldId) {
            const fieldToDelete = updatedFields.find(f => f.id === mod.fieldId);
            updatedFields = updatedFields.filter(f => f.id !== mod.fieldId);
            changeDescriptions.push(`Deleted "${fieldToDelete?.label || "field"}"`);
          }
          break;

        case "reorder":
          if (mod.fieldId && typeof mod.newIndex === "number") {
            const fieldIndex = updatedFields.findIndex(f => f.id === mod.fieldId);
            if (fieldIndex !== -1) {
              const [field] = updatedFields.splice(fieldIndex, 1);
              updatedFields.splice(mod.newIndex, 0, field);
              changeDescriptions.push(`Reordered "${field.label}"`);
            }
          }
          break;

        case "quiz-config":
          if (mod.fieldId && mod.quizConfig) {
            const fieldToConfig = updatedFields.find(f => f.id === mod.fieldId);
            updatedFields = updatedFields.map(f => {
              if (f.id === mod.fieldId) {
                return { 
                  ...f, 
                  quizConfig: { 
                    ...f.quizConfig, 
                    ...mod.quizConfig 
                  } 
                };
              }
              return f;
            });
            changeDescriptions.push(`Set quiz config for "${fieldToConfig?.label || "field"}"`);
          }
          break;
      }
    }

    // Update order property
    updatedFields = updatedFields.map((f, i) => ({ ...f, order: i }));
    
    // Set the description for history tracking
    if (changeDescriptions.length > 0) {
      setPendingDescription(changeDescriptions.join(", "));
    }
    
    onFieldsChange(updatedFields);

    if (newTitle) {
      onFormTitleChange(newTitle);
      setPendingDescription(prev => prev ? `${prev}, Changed title` : "Changed title");
    }
  }, [fields, onFieldsChange, onFormTitleChange]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const formContext: FormContext = {
        title: formTitle,
        fields: fields,
        selectedFieldId: selectedFieldId || undefined,
      };

      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: chatHistory,
          formContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.message || "I've processed your request.",
        modifications: data.modifications,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply modifications if any
      if (data.modifications?.length > 0 || data.newTitle) {
        applyModifications(data.modifications || [], data.newTitle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Keyboard shortcuts for undo/redo
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const getModificationIcon = (action: string) => {
    switch (action) {
      case "add":
        return <Plus className="w-2.5 h-2.5 text-black" />;
      case "update":
        return <Edit2 className="w-2.5 h-2.5 text-black" />;
      case "delete":
        return <Trash2 className="w-2.5 h-2.5 text-black" />;
      case "quiz-config":
        return <GraduationCap className="w-2.5 h-2.5 text-black" />;
      case "reorder":
        return <Sparkles className="w-2.5 h-2.5 text-black" />;
      default:
        return <Sparkles className="w-2.5 h-2.5 text-black" />;
    }
  };

  const getModificationLabel = (mod: FieldModification) => {
    switch (mod.action) {
      case "add":
        return `Added "${mod.field?.label || "new field"}"`;
      case "update":
        return `Updated field`;
      case "delete":
        return `Removed field`;
      case "reorder":
        return `Reordered field`;
      case "quiz-config":
        return `Updated quiz settings`;
      default:
        return "Modified form";
    }
  };

  // Insert field reference into input
  const insertFieldReference = (field: Field, index: number) => {
    const reference = `field ${index + 1} ("${field.label}")`;
    setInput(prev => prev + (prev ? " " : "") + reference);
    setShowFieldPicker(false);
    inputRef.current?.focus();
  };

  // Quick action suggestions - dynamically updated based on context
  const getQuickActions = useCallback(() => {
    const baseActions = [
      "Add a name field",
      "Add an email field",
      "Add a message textarea",
    ];

    const contextActions: string[] = [];
    
    // Add undo action if possible
    if (canUndo) {
      contextActions.push("Undo last change");
    }
    
    // Add quiz-related actions if there are fields
    if (fields.length > 0) {
      // Add quiz mode actions when quiz mode is enabled
      if (quizModeEnabled) {
        contextActions.push("Set correct answer for question 1");
        contextActions.push("Make question 1 worth 5 points");
      }
      contextActions.push("Make all fields required");
    }
    
    // Add reference to selected field
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (selectedField) {
        contextActions.push(`Update the selected field`);
        if (quizModeEnabled) {
          contextActions.push(`Set correct answer for selected field`);
        }
      }
    }

    return [...contextActions, ...baseActions].slice(0, 5);
  }, [canUndo, fields, selectedFieldId, quizModeEnabled]);

  // Quiz-specific quick actions
  const quizQuickActions = [
    { label: "Set correct answer", icon: Check, command: "Set the correct answer for question 1 to" },
    { label: "Assign points", icon: Award, command: "Make question 1 worth 10 points" },
    { label: "Add explanation", icon: HelpCircle, command: "Add explanation for question 1:" },
    { label: "Multiple correct", icon: Target, command: "Set multiple correct answers for question 1:" },
  ];

  const quickActions = getQuickActions();

  // Handle quick action click - special handling for undo
  const handleQuickAction = (action: string) => {
    if (action === "Undo last change") {
      handleUndo();
    } else {
      setInput(action);
      inputRef.current?.focus();
    }
  };

  // Format time for history display
  const formatHistoryTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Field Picker Modal */}
      {showFieldPicker && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">Select a Field</h3>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-200">
              {fields.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MousePointer2 className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">No fields yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Add fields to your form to reference them here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <button
                      key={field.id}
                      onClick={() => insertFieldReference(field, index)}
                      onMouseEnter={() => onHighlightField?.(field.id)}
                      onMouseLeave={() => onHighlightField?.(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 group ${
                        selectedFieldId === field.id
                          ? "bg-blue-50 border border-blue-100 ring-1 ring-blue-100"
                          : "hover:bg-neutral-50 border border-transparent hover:border-neutral-100"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 transition-colors ${
                        selectedFieldId === field.id ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:shadow-sm"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${selectedFieldId === field.id ? "text-blue-900" : "text-neutral-900"}`}>
                          {field.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500 capitalize">{field.type.replace("-", " ")}</span>
                          {field.required && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium border border-neutral-200">Required</span>
                          )}
                        </div>
                        
                        {/* Quiz Config & Options Preview */}
                        {(field.quizConfig || (field.options && field.options.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {field.quizConfig?.correctAnswer !== undefined && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md font-medium">
                                <Check className="w-2.5 h-2.5" />
                                Answer Set
                              </span>
                            )}
                            {field.quizConfig?.points && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-medium">
                                <Award className="w-2.5 h-2.5" />
                                {field.quizConfig.points} pts
                              </span>
                            )}
                            {field.options?.slice(0, 3).map((opt, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-md border border-neutral-200 truncate max-w-[100px]">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-medium text-neutral-400">Click to select</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
               <p className="text-xs text-neutral-500 text-center">
                Refers to fields by number (e.g., &quot;Field 1&quot;) for better AI accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-[400px] max-w-full bg-white border-l border-neutral-200 z-50 flex flex-col font-sans shadow-2xl shadow-neutral-200/50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 leading-none">AI Designer</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`p-2 rounded-lg transition-all relative group ${
                history.length > 1
                  ? "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  : "text-neutral-300 cursor-not-allowed"
              }`}
              disabled={history.length <= 1}
            >
              <History className="w-4 h-4" />
              {history.length > 1 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full mt-2 right-0 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                History
              </div>
            </button>

            <div className="h-4 w-px bg-neutral-200 mx-1" />

            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all group relative ${
                canUndo
                  ? "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  : "text-neutral-300 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Undo (Ctrl+Z)
              </div>
            </button>

            {/* Redo Button */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all group relative ${
                canRedo
                  ? "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  : "text-neutral-300 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Redo (Ctrl+Y)
              </div>
            </button>

            <div className="h-4 w-px bg-neutral-200 mx-1" />

            <button
              onClick={clearChat}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group relative"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Clear Chat
              </div>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Undo/Redo Feedback Toast */}
        {lastChangeDescription && (
          <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-neutral-900/90 backdrop-blur text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-2.5 h-2.5" />
            </div>
            {lastChangeDescription}
          </div>
        )}

        {/* History Panel */}
        {showHistoryPanel && history.length > 1 && (
          <div className="bg-neutral-50/50 border-b border-neutral-200 max-h-60 overflow-y-auto shadow-inner">
            <div className="sticky top-0 bg-neutral-50/95 backdrop-blur px-4 py-2 border-b border-neutral-200 flex items-center justify-between z-10">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Version History</span>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {history.slice().reverse().map((state, reverseIndex) => {
                const actualIndex = history.length - 1 - reverseIndex;
                const isCurrent = actualIndex === historyIndex;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => jumpToHistoryState(actualIndex)}
                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 rounded-xl transition-all border ${
                      isCurrent 
                        ? "bg-white border-neutral-200 shadow-sm ring-1 ring-neutral-100" 
                        : "border-transparent hover:bg-white hover:border-neutral-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                       <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        isCurrent 
                          ? "bg-neutral-900 text-white border-neutral-900" 
                          : "bg-white text-neutral-500 border-neutral-200"
                      }`}>
                        {actualIndex + 1}
                      </span>
                      {reverseIndex !== history.length - 1 && (
                        <div className="w-px h-2 bg-neutral-200" />
                      )}
                    </div>
                   
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isCurrent ? "text-neutral-900" : "text-neutral-600"}`}>
                        {state.description || "Form modification"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {formatHistoryTime(state.timestamp)}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          • {state.fields.length} fields
                        </span>
                      </div>
                    </div>
                    
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Field Indicator */}
        {selectedFieldId && (
          <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3 animate-in slide-in-from-top-1">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600/80 font-medium">Focusing on</p>
              <p className="text-sm font-semibold text-blue-900 truncate">
                {fields.find(f => f.id === selectedFieldId)?.label || "Selected Field"}
              </p>
            </div>
            <button
              onClick={() => onFieldSelect?.(null)}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
            >
              Clear Focus
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-200 hover:scrollbar-thumb-neutral-300">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xl shadow-neutral-900/10 mb-6 rotate-3 hover:rotate-6 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                AI Form Designer
              </h3>
              <p className="text-sm text-neutral-500 max-w-[260px] leading-relaxed mb-8">
                I can help you build your form, configure quizzes, and organize fields. Just ask naturally!
              </p>
              
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {/* Quick Start Cards */}
                <button 
                  onClick={() => handleQuickAction("Create a contact form with name, email, and message")}
                  className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-neutral-900">Quick Start</span>
                  </div>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-900">&quot;Create a contact form&quot;</p>
                </button>

                <button 
                  onClick={() => handleQuickAction("Add a multiple choice question about product satisfaction")}
                  className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all text-left group"
                >
                   <div className="flex items-center gap-2 mb-1">
                    <Plus className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-neutral-900">Add Fields</span>
                  </div>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-900">&quot;Add a satisfaction question&quot;</p>
                </button>

                {quizModeEnabled && (
                  <button 
                    onClick={() => handleQuickAction("Make question 1 worth 10 points and set option A as correct")}
                    className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all text-left group"
                  >
                     <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-semibold text-neutral-900">Quiz Mode</span>
                    </div>
                    <p className="text-sm text-neutral-600 group-hover:text-neutral-900">&quot;Set points and answers&quot;</p>
                  </button>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    relative max-w-[90%] rounded-2xl p-4 shadow-sm
                    ${message.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-white border border-neutral-200 text-neutral-800"
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Modifications List */}
                  {message.modifications && message.modifications.length > 0 && (
                    <div className={`mt-3 pt-3 border-t space-y-1.5 ${message.role === "user" ? "border-neutral-800" : "border-neutral-100"}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${message.role === "user" ? "text-neutral-500" : "text-neutral-400"}`}>
                        Actions Taken
                      </p>
                      {message.modifications.map((mod, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                            message.role === "user" 
                              ? "bg-neutral-800/50 text-neutral-200" 
                              : "bg-neutral-50 text-neutral-700"
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded-md ${
                             message.role === "user" ? "bg-neutral-700" : "bg-white border border-neutral-200"
                          }`}>
                            {getModificationIcon(mod.action)}
                          </div>
                          <span className="flex-1 leading-relaxed">{getModificationLabel(mod)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-[10px] mt-2 flex items-center justify-end opacity-60 ${
                    message.role === "user" ? "text-neutral-400" : "text-neutral-400"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-sm text-neutral-500 animate-pulse">Designing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center w-full">
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2">
                <X className="w-3.5 h-3.5" />
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-neutral-200">
          
          {/* Quick Actions / Suggestions Scroll */}
          {messages.length > 0 && (
             <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none mask-fade-sides">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap font-medium ${
                    action === "Undo last change" 
                      ? "border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:border-neutral-400" 
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {action === "Undo last change" && <Undo2 className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex flex-col gap-2">
            {/* Quiz Quick Actions Toggle Panel */}
            {showQuizQuickActions && quizModeEnabled && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-neutral-200 shadow-xl p-2 animate-in slide-in-from-bottom-2 z-20">
                <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    Quiz Commands
                  </span>
                  <button onClick={() => setShowQuizQuickActions(false)} className="text-neutral-400 hover:text-neutral-900">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {quizQuickActions.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(qa.command);
                        setShowQuizQuickActions(false);
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors text-left group"
                    >
                      <div className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <qa.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-neutral-700 group-hover:text-neutral-900">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative group">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFieldId 
                  ? `Describe changes for the selected field...` 
                  : quizModeEnabled
                    ? "Ask to set answers, points, or add questions..."
                    : "Describe the form you want to build..."}
                className="w-full min-h-[50px] max-h-[120px] resize-none rounded-xl border border-neutral-300 bg-white pl-4 pr-12 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all shadow-sm"
                style={{ height: input ? 'auto' : '50px' }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                 {/* Quiz Mode Toggle */}
                 {quizModeEnabled && fields.length > 0 && (
                  <button
                    onClick={() => setShowQuizQuickActions(!showQuizQuickActions)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showQuizQuickActions 
                        ? "bg-purple-100 text-purple-700" 
                        : "text-neutral-400 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                    title="Quiz commands"
                  >
                    <GraduationCap className="w-4 h-4" />
                  </button>
                )}

                {/* Field Picker Toggle */}
                {fields.length > 0 && (
                  <button
                    onClick={() => setShowFieldPicker(true)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Reference a field"
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="w-px h-4 bg-neutral-200 mx-1" />

                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`
                    p-2 rounded-lg transition-all
                    ${input.trim() && !isLoading
                      ? "bg-neutral-900 text-white hover:bg-neutral-800 shadow-md transform hover:-translate-y-0.5"
                      : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-neutral-400 text-center font-medium">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
