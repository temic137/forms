"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Field, FieldType, QuizConfig } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";
import { Send, MessageSquare, Trash2, Plus, Edit2, Sparkles, Undo2, Redo2, MousePointer2, GraduationCap, X, Check } from "lucide-react";

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
  newIndex?: number;
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
}: InlineAIChatProps) {
  // highlightedFieldId is passed but handled externally via onHighlightField callbacks
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // History for undo/redo functionality
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, formTitle]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const previousState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onFieldsChange(previousState.fields);
      onFormTitleChange(previousState.formTitle);
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
            updatedFields.push(newField);
          }
          break;

        case "update":
          if (mod.fieldId && mod.field) {
            updatedFields = updatedFields.map(f => {
              if (f.id === mod.fieldId) {
                return { ...f, ...mod.field };
              }
              return f;
            });
          }
          break;

        case "delete":
          if (mod.fieldId) {
            updatedFields = updatedFields.filter(f => f.id !== mod.fieldId);
          }
          break;

        case "reorder":
          if (mod.fieldId && typeof mod.newIndex === "number") {
            const fieldIndex = updatedFields.findIndex(f => f.id === mod.fieldId);
            if (fieldIndex !== -1) {
              const [field] = updatedFields.splice(fieldIndex, 1);
              updatedFields.splice(mod.newIndex, 0, field);
            }
          }
          break;

        case "quiz-config":
          if (mod.fieldId && mod.quizConfig) {
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
          }
          break;
      }
    }

    // Update order property
    updatedFields = updatedFields.map((f, i) => ({ ...f, order: i }));
    onFieldsChange(updatedFields);

    if (newTitle) {
      onFormTitleChange(newTitle);
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
        return <Plus className="w-3 h-3 text-green-600" />;
      case "update":
        return <Edit2 className="w-3 h-3 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-3 h-3 text-red-600" />;
      case "quiz-config":
        return <GraduationCap className="w-3 h-3 text-amber-600" />;
      case "reorder":
        return <Sparkles className="w-3 h-3 text-purple-600" />;
      default:
        return <Sparkles className="w-3 h-3 text-purple-600" />;
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
      contextActions.push("Set correct answer for question 1");
      contextActions.push("Make all fields required");
    }
    
    // Add reference to selected field
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (selectedField) {
        contextActions.push(`Update the selected field`);
      }
    }

    return [...contextActions, ...baseActions].slice(0, 5);
  }, [canUndo, fields, selectedFieldId]);

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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Select a Field</h3>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {fields.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No fields in the form yet</p>
              ) : (
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <button
                      key={field.id}
                      onClick={() => insertFieldReference(field, index)}
                      onMouseEnter={() => onHighlightField?.(field.id)}
                      onMouseLeave={() => onHighlightField?.(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                        selectedFieldId === field.id
                          ? "bg-black/10 border border-black/20"
                          : "hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{field.label}</p>
                        <p className="text-xs text-gray-500">{field.type}</p>
                      </div>
                      {field.quizConfig?.correctAnswer && (
                        <span title="Has quiz config">
                          <GraduationCap className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Click a field to reference it in your message
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${
                canUndo
                  ? "text-gray-600 hover:text-black hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            {/* Redo Button */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${
                canRedo
                  ? "text-gray-600 hover:text-black hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              title={canRedo ? "Redo (Ctrl+Shift+Z)" : "Nothing to redo"}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Field Indicator */}
        {selectedFieldId && (
          <div className="px-4 py-2 bg-black/5 border-b border-gray-200 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-black" />
            <span className="text-xs text-gray-600">
              Selected: <span className="font-medium text-black">{fields.find(f => f.id === selectedFieldId)?.label || "Field"}</span>
            </span>
            <button
              onClick={() => onFieldSelect?.(null)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                How can I help?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                I can add, edit, or remove fields, configure quiz settings, and more. Just ask!
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-left">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <GraduationCap className="w-4 h-4 text-amber-500 mb-1" />
                  <p className="text-xs font-medium text-gray-700">Quiz Mode</p>
                  <p className="text-[10px] text-gray-500">Set answers & points</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <Undo2 className="w-4 h-4 text-blue-500 mb-1" />
                  <p className="text-xs font-medium text-gray-700">Undo/Redo</p>
                  <p className="text-[10px] text-gray-500">Ctrl+Z to undo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.slice(0, 3).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-black/10 transition-colors"
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
                    max-w-[85%] rounded-xl px-4 py-2.5
                    ${message.role === "user"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show modifications */}
                  {message.modifications && message.modifications.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300/30 space-y-1">
                      {message.modifications.map((mod, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs bg-white/90 px-2 py-1 rounded-md"
                        >
                          {getModificationIcon(mod.action)}
                          <span className="text-gray-700">{getModificationLabel(mod)}</span>
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
              <div className="bg-gray-100 rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {messages.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className={`text-xs px-2.5 py-1 bg-white text-gray-600 rounded-full border border-gray-200 hover:border-black/20 hover:bg-black/5 transition-colors whitespace-nowrap ${
                      action === "Undo last change" ? "border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50" : ""
                    }`}
                  >
                    {action === "Undo last change" && <Undo2 className="w-3 h-3 inline mr-1" />}
                    {action}
                  </button>
                ))}
              </div>
              <button
                onClick={clearChat}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-2"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            {/* Field Picker Button */}
            {fields.length > 0 && (
              <button
                onClick={() => setShowFieldPicker(true)}
                className="p-2.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-black hover:border-black/20 transition-colors"
                title="Select a field to reference"
              >
                <MousePointer2 className="w-4 h-4" />
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFieldId 
                ? `Describe changes for the selected field...` 
                : "Ask me to modify your form..."}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 max-h-24"
              style={{ minHeight: "42px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`
                p-2.5 rounded-lg transition-all
                ${input.trim() && !isLoading
                  ? "bg-black text-white hover:bg-black/80"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
