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
    let lastModifiedFieldId: string | null = null;

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
            
            lastModifiedFieldId = newField.id;

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
            lastModifiedFieldId = mod.fieldId;
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
              lastModifiedFieldId = mod.fieldId;
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
            lastModifiedFieldId = mod.fieldId;
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

    // Highlight the modified field
    if (lastModifiedFieldId && onHighlightField) {
      // Small delay to allow render
      setTimeout(() => {
        onHighlightField(lastModifiedFieldId);
      }, 50);
    }
  }, [fields, onFieldsChange, onFormTitleChange, onHighlightField]);

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
          <div className="bg-white rounded-2xl border border-black w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="font-bold text-black font-paper text-lg">Select a Field</h3>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="p-1.5 text-black/60 hover:text-black hover:bg-gray-100 rounded-full transition-colors border-2 border-transparent hover:border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300">
              {fields.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-gray-200">
                    <MousePointer2 className="w-6 h-6 text-black/30" />
                  </div>
                  <p className="text-sm font-bold text-black font-paper">No fields yet</p>
                  <p className="text-xs text-black/50 mt-1 font-paper">Add fields to your form to reference them here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <button
                      key={field.id}
                      onClick={() => insertFieldReference(field, index)}
                      onMouseEnter={() => onHighlightField?.(field.id)}
                      onMouseLeave={() => onHighlightField?.(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 group border ${
                        selectedFieldId === field.id
                          ? "bg-blue-50 border-black"
                          : "bg-transparent border-transparent hover:bg-white hover:border-black"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors border-2 ${
                        selectedFieldId === field.id ? "bg-white text-black border-black" : "bg-gray-100 text-gray-500 border-transparent group-hover:bg-white group-hover:border-black group-hover:text-black"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate font-paper ${selectedFieldId === field.id ? "text-black" : "text-black/80"}`}>
                          {field.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-black/50 capitalize font-bold font-paper">{field.type.replace("-", " ")}</span>
                          {field.required && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-black/70 rounded-md font-bold border border-black/20 font-paper">Required</span>
                          )}
                        </div>
                        
                        {/* Quiz Config & Options Preview */}
                        {(field.quizConfig || (field.options && field.options.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {field.quizConfig?.correctAnswer !== undefined && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md font-bold font-paper">
                                <Check className="w-2.5 h-2.5" />
                                Answer Set
                              </span>
                            )}
                            {field.quizConfig?.points && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold font-paper">
                                <Award className="w-2.5 h-2.5" />
                                {field.quizConfig.points} pts
                              </span>
                            )}
                            {field.options?.slice(0, 3).map((opt, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-black/60 rounded-md border border-black/10 truncate max-w-[100px] font-paper font-bold">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-bold text-black/40 font-paper">Click to select</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
               <p className="text-xs text-black/50 text-center font-bold font-paper">
                Refers to fields by number (e.g., &quot;Field 1&quot;) for better AI accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center border border-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black leading-none">AI Designer</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 border border-black animate-pulse" />
                <span className="text-[12px] font-bold text-black/60 uppercase tracking-wide">Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`p-2 rounded-lg transition-all relative group border ${
                history.length > 1
                  ? "border-transparent hover:border-black hover:bg-gray-50 text-black"
                  : "border-transparent text-gray-300 cursor-not-allowed"
              }`}
              disabled={history.length <= 1}
            >
              <History className="w-4 h-4" />
              {history.length > 1 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full mt-2 right-0 bg-black text-white text-xs py-1 px-2 rounded border border-black opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-paper">
                History
              </div>
            </button>

            <div className="h-4 w-px bg-black/20 mx-1" />

            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all group relative border ${
                canUndo
                  ? "border-transparent hover:border-black hover:bg-gray-50 text-black"
                  : "border-transparent text-gray-300 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-black text-white text-xs py-1 px-2 rounded border border-black opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-paper">
                Undo (Ctrl+Z)
              </div>
            </button>

            {/* Redo Button */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all group relative border-2 ${
                canRedo
                  ? "border-transparent hover:border-black hover:bg-gray-50 text-black"
                  : "border-transparent text-gray-300 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-black text-white text-xs py-1 px-2 rounded border border-black opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-paper">
                Redo (Ctrl+Y)
              </div>
            </button>

            <div className="h-4 w-px bg-black/20 mx-1" />

            <button
              onClick={clearChat}
              className="p-2 text-black/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative border border-transparent hover:border-red-200"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
              <div className="absolute top-full mt-2 right-0 bg-black text-white text-xs py-1 px-2 rounded border border-black opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-paper">
                Clear Chat
              </div>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-black/60 hover:text-black hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Undo/Redo Feedback Toast */}
        {lastChangeDescription && (
          <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black text-white text-sm font-bold font-paper rounded-full flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 border border-black">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center border border-black">
              <Check className="w-3 h-3" />
            </div>
            {lastChangeDescription}
          </div>
        )}

        {/* History Panel */}
        {showHistoryPanel && history.length > 1 && (
          <div className="bg-white border-b border-gray-200 max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-2 border-b border-gray-200 flex items-center justify-between z-10">
              <span className="text-xs font-bold text-black uppercase tracking-wider font-paper">Version History</span>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-black/60 hover:text-black"
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
                        ? "bg-white border-black" 
                        : "border-transparent hover:bg-white hover:border-black/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border ${
                        isCurrent 
                          ? "bg-black text-white border-black" 
                          : "bg-white text-black border-black/30"
                      }`}>
                        {actualIndex + 1}
                      </span>
                      {reverseIndex !== history.length - 1 && (
                        <div className="w-px h-2 bg-black/20" />
                      )}
                    </div>
                   
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate font-paper ${isCurrent ? "text-black" : "text-black/70"}`}>
                        {state.description || "Form modification"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-black/50 font-paper font-bold">
                          {formatHistoryTime(state.timestamp)}
                        </span>
                        <span className="text-[10px] text-black/50 font-paper font-bold">
                          • {state.fields.length} fields
                        </span>
                      </div>
                    </div>
                    
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full font-bold font-paper">
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
          <div className="px-4 py-2.5 bg-blue-50 border-b border-gray-200 flex items-center gap-3 animate-in slide-in-from-top-1">
            <div className="w-8 h-8 rounded-lg bg-white border border-black flex items-center justify-center text-black">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-black/60 font-bold font-paper">Focusing on</p>
              <p className="text-sm font-bold text-black truncate font-paper">
                {fields.find(f => f.id === selectedFieldId)?.label || "Selected Field"}
              </p>
            </div>
            <button
              onClick={() => onFieldSelect?.(null)}
              className="px-2 py-1 text-xs font-bold text-black bg-white border border-black hover:bg-gray-50 rounded-lg transition-colors font-paper"
            >
              Clear Focus
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center border border-black mb-6 rotate-3 hover:rotate-6 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2 font-paper">
                AI Form Designer
              </h3>
              <p className="text-base text-black/60 max-w-[260px] leading-relaxed mb-8 font-paper font-bold">
                I can help you build your form, configure quizzes, and organize fields. Just ask naturally!
              </p>
              
              <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                {/* Quick Start Cards */}
                <button 
                  onClick={() => handleQuickAction("Create a contact form with name, email, and message")}
                  className="p-3 rounded-xl bg-white border border-black hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-black" />
                    <span className="text-sm font-bold text-black font-paper">Quick Start</span>
                  </div>
                  <p className="text-sm text-black/70 font-paper font-bold group-hover:text-black">&quot;Create a contact form&quot;</p>
                </button>

                <button 
                  onClick={() => handleQuickAction("Add a multiple choice question about product satisfaction")}
                  className="p-3 rounded-xl bg-white border border-black hover:-translate-y-0.5 transition-all text-left group"
                >
                   <div className="flex items-center gap-2 mb-1">
                    <Plus className="w-4 h-4 text-black" />
                    <span className="text-sm font-bold text-black font-paper">Add Fields</span>
                  </div>
                  <p className="text-sm text-black/70 font-paper font-bold group-hover:text-black">&quot;Add a satisfaction question&quot;</p>
                </button>

                {quizModeEnabled && (
                  <button 
                    onClick={() => handleQuickAction("Make question 1 worth 10 points and set option A as correct")}
                    className="p-3 rounded-xl bg-white border border-black hover:-translate-y-0.5 transition-all text-left group"
                  >
                     <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black font-paper">Quiz Mode</span>
                    </div>
                    <p className="text-sm text-black/70 font-paper font-bold group-hover:text-black">&quot;Set points and answers&quot;</p>
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
                    relative max-w-[90%] rounded-2xl p-4 font-paper
                    ${message.role === "user"
                      ? "bg-black text-white"
                      : "bg-white border border-black text-black"
                    }
                  `}
                >
                  <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Modifications List */}
                  {message.modifications && message.modifications.length > 0 && (
                    <div className={`mt-3 pt-3 border-t-2 space-y-1.5 ${message.role === "user" ? "border-white/20" : "border-black/10"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${message.role === "user" ? "text-white/70" : "text-black/50"}`}>
                        Actions Taken
                      </p>
                      {message.modifications.map((mod, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 text-xs font-bold p-2 rounded-lg border ${
                            message.role === "user" 
                              ? "bg-white/10 text-white border-white/20" 
                              : "bg-gray-50 text-black border-black/10"
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded-md border ${
                             message.role === "user" ? "bg-black border-white/20" : "bg-white border-black/20"
                          }`}>
                            {getModificationIcon(mod.action)}
                          </div>
                          <span className="flex-1 leading-relaxed">{getModificationLabel(mod)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-[10px] font-bold mt-2 flex items-center justify-end opacity-60 ${
                    message.role === "user" ? "text-white/70" : "text-black/50"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="bg-white border border-black rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-sm font-bold text-black font-paper animate-pulse">Designing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center w-full">
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 text-xs font-bold font-paper flex items-center gap-2">
                <X className="w-3.5 h-3.5" />
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          
          {/* Quick Actions / Suggestions Scroll */}
          {messages.length > 0 && (
             <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none mask-fade-sides">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap font-bold font-paper ${
                    action === "Undo last change" 
                      ? "border-black bg-gray-100 text-black hover:bg-gray-200" 
                      : "border-black/20 bg-white text-black/70 hover:border-black hover:text-black hover:bg-gray-50"
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
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-black p-2 animate-in slide-in-from-bottom-2 z-20">
                <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-black/10">
                  <span className="text-xs font-bold text-black flex items-center gap-1.5 font-paper">
                    <GraduationCap className="w-3.5 h-3.5 text-black" />
                    Quiz Commands
                  </span>
                  <button onClick={() => setShowQuizQuickActions(false)} className="text-black/40 hover:text-black">
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
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left group border border-transparent hover:border-black/10"
                    >
                      <div className="w-6 h-6 rounded-md bg-white border border-black/20 text-black/60 flex items-center justify-center group-hover:border-black group-hover:text-black transition-all">
                        <qa.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-black/70 group-hover:text-black font-paper">{qa.label}</span>
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
                className="w-full min-h-[50px] max-h-[120px] resize-none rounded-xl border border-gray-300 bg-white pl-4 pr-12 py-3 text-sm font-bold text-black placeholder:text-black/40 focus:outline-none focus:border-black transition-all font-paper"
                style={{ height: input ? 'auto' : '50px' }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                 {/* Quiz Mode Toggle */}
                 {quizModeEnabled && fields.length > 0 && (
                  <button
                    onClick={() => setShowQuizQuickActions(!showQuizQuickActions)}
                    className={`p-1.5 rounded-lg transition-colors border ${
                      showQuizQuickActions 
                        ? "bg-purple-100 text-purple-900 border-purple-200" 
                        : "border-transparent text-black/40 hover:text-black hover:bg-gray-50 hover:border-black/20"
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
                    className="p-1.5 rounded-lg text-black/40 hover:text-black hover:bg-gray-50 transition-colors border border-transparent hover:border-black/20"
                    title="Reference a field"
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="w-px h-4 bg-black/20 mx-1" />

                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`
                    p-2 rounded-lg transition-all border
                    ${input.trim() && !isLoading
                      ? "bg-black text-white border-black hover:bg-gray-800 transform hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-black/40 text-center font-bold font-paper">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
