"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Field, FieldType, QuizConfig } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";
import { 
  Send, 
  MessageSquare, 
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
  Eye,
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
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Field Picker Modal */}
      {showFieldPicker && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-3">
          <div className="bg-white rounded-xl border border-black/30 w-full max-w-sm max-h-[65vh] flex flex-col">
            <div className="px-3 py-2 border-b border-black/20 flex items-center justify-between">
              <h3 className="font-bold text-black text-sm">Select a Field</h3>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="p-0.5 text-black/60 hover:text-black rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              {fields.length === 0 ? (
                <p className="text-center text-black/50 py-6 text-[11px] font-bold">No fields in the form yet</p>
              ) : (
                <div className="space-y-0.5">
                  {fields.map((field, index) => (
                    <button
                      key={field.id}
                      onClick={() => insertFieldReference(field, index)}
                      onMouseEnter={() => onHighlightField?.(field.id)}
                      onMouseLeave={() => onHighlightField?.(null)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-start gap-2 ${
                        selectedFieldId === field.id
                          ? "bg-black/10 border border-black/30"
                          : "hover:bg-black/5 border border-transparent"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white border border-black/30 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-black truncate">{field.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-black/60">{field.type}</span>
                          {field.required && (
                            <span className="text-[8px] px-1 bg-white border border-black/30 text-black rounded-full font-bold">Required</span>
                          )}
                        </div>
                        {/* Show quiz config details */}
                        {field.quizConfig && (field.quizConfig.correctAnswer !== undefined || field.quizConfig.points) && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {field.quizConfig.correctAnswer !== undefined && (
                              <span className="text-[8px] px-1 py-0.5 bg-white border border-black/30 text-black rounded-full flex items-center gap-0.5 font-bold">
                                <Check className="w-2 h-2" />
                                {typeof field.quizConfig.correctAnswer === 'string' 
                                  ? field.quizConfig.correctAnswer.substring(0, 15) + (field.quizConfig.correctAnswer.length > 15 ? '...' : '')
                                  : 'Set'}
                              </span>
                            )}
                            {field.quizConfig.points && (
                              <span className="text-[8px] px-1 py-0.5 bg-white border border-black/30 text-black rounded-full flex items-center gap-0.5 font-bold">
                                <Award className="w-2 h-2" />
                                {field.quizConfig.points} pts
                              </span>
                            )}
                          </div>
                        )}
                        {/* Show options preview for choice fields */}
                        {field.options && field.options.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {field.options.slice(0, 3).map((opt, i) => (
                              <span key={i} className="text-[8px] px-1 py-0.5 bg-white border border-black/20 text-black rounded-full truncate max-w-[80px] font-bold">
                                {opt}
                              </span>
                            ))}
                            {field.options.length > 3 && (
                              <span className="text-[8px] text-black/40 font-bold">+{field.options.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        {field.quizConfig?.correctAnswer !== undefined && (
                          <span title="Has correct answer">
                            <GraduationCap className="w-3 h-3 text-black" />
                          </span>
                        )}
                        <Eye className="w-3 h-3 text-black/20" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-black/20 space-y-1">
              <p className="text-[10px] text-black/60 text-center font-bold">
                Click a field to reference it in your message
              </p>
              <p className="text-[9px] text-black/40 text-center">
                Hover to highlight field in the builder
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-[25rem] max-w-full bg-white border-l border-black/20 z-50 flex flex-col font-paper">
        {/* Header */}
        <div className="border-b border-black/20 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <h2 className="text-sm font-bold text-black">AI Assistant</h2>
            {quizModeEnabled && (
              <span className="px-1.5 py-0.5 bg-white border border-black/30 text-black text-[9px] font-bold rounded-full">
                Quiz
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`p-1 rounded-full transition-colors relative ${
                history.length > 1
                  ? "text-black hover:bg-black/5"
                  : "text-black/20 cursor-not-allowed"
              }`}
              disabled={history.length <= 1}
              title={history.length > 1 ? `View history (${history.length} states)` : "No history yet"}
            >
              <History className="w-3.5 h-3.5" />
              {history.length > 1 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-black text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                  {Math.min(history.length, 99)}
                </span>
              )}
            </button>
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1 rounded-full transition-colors ${
                canUndo
                  ? "text-black hover:bg-black/5"
                  : "text-black/20 cursor-not-allowed"
              }`}
              title={canUndo ? `Undo: ${history[historyIndex]?.description || "last change"} (Ctrl+Z)` : "Nothing to undo"}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            {/* Redo Button */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1 rounded-full transition-colors ${
                canRedo
                  ? "text-black hover:bg-black/5"
                  : "text-black/20 cursor-not-allowed"
              }`}
              title={canRedo ? `Redo: ${history[historyIndex + 1]?.description || "change"} (Ctrl+Shift+Z)` : "Nothing to redo"}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-black/20 mx-0.5" />
            <button
              onClick={onClose}
              className="p-1 text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Undo/Redo Feedback Toast */}
        {lastChangeDescription && (
          <div className="px-3 py-1.5 bg-black text-white text-[10px] flex items-center gap-1.5 animate-in slide-in-from-top duration-200">
            <Check className="w-3 h-3" />
            <span className="font-bold">{lastChangeDescription}</span>
          </div>
        )}

        {/* History Panel */}
        {showHistoryPanel && history.length > 1 && (
          <div className="border-b border-black/20 bg-white max-h-40 overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-black/20 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-[10px] font-bold text-black">History ({history.length} states)</span>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-black/60 hover:text-black"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-black/10">
              {history.slice().reverse().map((state, reverseIndex) => {
                const actualIndex = history.length - 1 - reverseIndex;
                const isCurrent = actualIndex === historyIndex;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => jumpToHistoryState(actualIndex)}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                      isCurrent 
                        ? "bg-black/5" 
                        : "hover:bg-black/5"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isCurrent 
                        ? "bg-black text-white" 
                        : "bg-white border border-black/30 text-black"
                    }`}>
                      {actualIndex + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] truncate ${isCurrent ? "font-bold text-black" : "text-black/70"}`}>
                        {state.description || `${state.fields.length} fields`}
                      </p>
                      <p className="text-[9px] text-black/40">
                        {formatHistoryTime(state.timestamp)}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 bg-black text-white text-[8px] rounded-full font-bold">Now</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Field Indicator */}
        {selectedFieldId && (
          <div className="px-3 py-1.5 bg-black/5 border-b border-black/20 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-black" />
            <span className="text-[10px] text-black/70">
              Selected: <span className="font-bold text-black">{fields.find(f => f.id === selectedFieldId)?.label || "Field"}</span>
            </span>
            <button
              onClick={() => onFieldSelect?.(null)}
              className="ml-auto text-[9px] text-black/50 hover:text-black font-bold"
            >
              Clear
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {messages.length === 0 ? (
            <div className="text-center py-5">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white border border-black/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-sm font-bold text-black mb-1.5">
                How can I help?
              </h3>
              <p className="text-[11px] text-black/60 mb-3">
                I can add, edit, or remove fields, configure quiz settings, and more. Just ask!
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-1.5 mb-3 text-left">
                <div className="p-1.5 bg-white rounded-lg border border-black/20">
                  <GraduationCap className="w-3 h-3 text-black mb-0.5" />
                  <p className="text-[10px] font-bold text-black">Quiz Mode</p>
                  <p className="text-[9px] text-black/50">Set answers & points</p>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-black/20">
                  <Undo2 className="w-3 h-3 text-black mb-0.5" />
                  <p className="text-[10px] font-bold text-black">Undo/Redo</p>
                  <p className="text-[9px] text-black/50">Ctrl+Z to undo</p>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-black/20">
                  <Zap className="w-3 h-3 text-black mb-0.5" />
                  <p className="text-[10px] font-bold text-black">Multi-Step</p>
                  <p className="text-[9px] text-black/50">Complex commands</p>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-black/20">
                  <MousePointer2 className="w-3 h-3 text-black mb-0.5" />
                  <p className="text-[10px] font-bold text-black">Field Picker</p>
                  <p className="text-[9px] text-black/50">Click to reference</p>
                </div>
              </div>

              {/* Example commands */}
              <div className="text-left mb-3">
                <p className="text-[9px] text-black/40 uppercase tracking-wide mb-1.5 font-bold">Try saying:</p>
                <div className="space-y-1">
                  <p className="text-[10px] text-black/70">&quot;Add name and email fields, make them required&quot;</p>
                  <p className="text-[10px] text-black/70">&quot;The answer to question 1 is option B&quot;</p>
                  <p className="text-[10px] text-black/70">&quot;Make field 2 similar to field 1&quot;</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center">
                {quickActions.slice(0, 3).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className="text-[10px] px-2.5 py-1 bg-white border border-black/30 text-black rounded-full hover:bg-black/5 transition-colors font-bold"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-xl px-2.5 py-1.5
                    ${message.role === "user"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-white border border-black/20 text-black rounded-bl-sm"
                    }
                  `}
                >
                  <p className="text-[11px] whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show modifications */}
                  {message.modifications && message.modifications.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-black/10 space-y-0.5">
                      {message.modifications.map((mod, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-[10px] bg-white border border-black/20 px-1.5 py-0.5 rounded-md"
                        >
                          {getModificationIcon(mod.action)}
                          <span className="text-black font-bold">{getModificationLabel(mod)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-black/20 rounded-xl rounded-bl-sm px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <Spinner size="sm" />
                  <span className="text-[11px] text-black/60 font-bold">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-white border border-black/30 text-black rounded-lg px-3 py-1.5 text-[10px] font-bold">
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-black/20 bg-white">
          {/* Quiz Quick Actions Panel */}
          {showQuizQuickActions && quizModeEnabled && (
            <div className="mb-2 p-2 bg-white border border-black/30 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-black flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Quiz Commands
                </span>
                <button
                  onClick={() => setShowQuizQuickActions(false)}
                  className="text-black/60 hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {quizQuickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(qa.command);
                      setShowQuizQuickActions(false);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-1 px-1.5 py-1 bg-white text-black text-[9px] rounded border border-black/30 hover:border-black/60 transition-colors text-left font-bold"
                  >
                    <qa.icon className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className={`text-[9px] px-2 py-0.5 bg-white text-black rounded-full border border-black/30 hover:border-black/60 hover:bg-black/5 transition-colors whitespace-nowrap font-bold ${
                      action === "Undo last change" ? "border-black bg-black/5" : ""
                    }`}
                  >
                    {action === "Undo last change" && <Undo2 className="w-2.5 h-2.5 inline mr-0.5" />}
                    {action}
                  </button>
                ))}
              </div>
              <button
                onClick={clearChat}
                className="p-1 text-black/60 hover:text-black hover:bg-black/5 rounded-full transition-colors ml-1.5"
                title="Clear chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-1.5">
            {/* Field Picker Button */}
            {fields.length > 0 && (
              <button
                onClick={() => setShowFieldPicker(true)}
                className="p-1.5 rounded-full border border-black/30 bg-white text-black hover:bg-black/5 hover:border-black/60 transition-colors"
                title="Select a field to reference"
              >
                <MousePointer2 className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Quiz Actions Button */}
            {quizModeEnabled && fields.length > 0 && (
              <button
                onClick={() => setShowQuizQuickActions(!showQuizQuickActions)}
                className={`p-1.5 rounded-full border transition-colors ${
                  showQuizQuickActions 
                    ? "border-black bg-black/5 text-black" 
                    : "border-black/30 bg-white text-black hover:bg-black/5 hover:border-black/60"
                }`}
                title="Quiz commands"
              >
                <GraduationCap className="w-3.5 h-3.5" />
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFieldId 
                ? `Describe changes for the selected field...` 
                : quizModeEnabled
                  ? "Try: 'Set the answer to question 1 as B'"
                  : "Ask me to modify your form..."}
              className="flex-1 resize-none rounded-lg border border-black/30 bg-white px-2.5 py-1.5 text-[11px] text-black placeholder:text-black/40 focus:outline-none focus:border-black/60 transition-colors"
              style={{ minHeight: "34px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`
                p-1.5 rounded-full transition-all
                ${input.trim() && !isLoading
                  ? "bg-black text-white hover:bg-black/80 border border-black"
                  : "bg-white text-black/30 border border-black/20 cursor-not-allowed"
                }
              `}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
