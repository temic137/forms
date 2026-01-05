"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Field, FieldType } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";
import { Send, MessageSquare, Trash2, Plus, Edit2, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modifications?: FieldModification[];
  timestamp: Date;
}

interface FieldModification {
  action: "add" | "update" | "delete" | "reorder";
  fieldId?: string;
  field?: Partial<Field>;
  newIndex?: number;
}

interface FormContext {
  title: string;
  fields: Field[];
}

interface InlineAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  onFormTitleChange: (title: string) => void;
}

export default function InlineAIChat({
  isOpen,
  onClose,
  formTitle,
  fields,
  onFieldsChange,
  onFormTitleChange,
}: InlineAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      };

      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
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
      default:
        return "Modified form";
    }
  };

  // Quick action suggestions
  const quickActions = [
    "Add a name field",
    "Add an email field",
    "Add a message textarea",
    "Make all fields required",
    "Add rating question",
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
                I can add, edit, or remove fields from your form. Just ask!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.slice(0, 3).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action);
                      inputRef.current?.focus();
                    }}
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
                    onClick={() => {
                      setInput(action);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-2.5 py-1 bg-white text-gray-600 rounded-full border border-gray-200 hover:border-black/20 hover:bg-black/5 transition-colors whitespace-nowrap"
                  >
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
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to modify your form..."
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
