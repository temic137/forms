"use client";

import { useState, useEffect, useRef } from "react";
import { Field } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  fieldId?: string;
}

interface ConversationalFormProps {
  fields: Field[];
  formTitle: string;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  styling?: {
    primaryColor?: string;
    backgroundColor?: string;
    buttonColor?: string;
  };
}

export default function ConversationalForm({
  fields,
  formTitle,
  onSubmit,
  styling
}: ConversationalFormProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const primaryColor = styling?.primaryColor || "#3b82f6";
  const bgColor = styling?.backgroundColor || "#f9fafb";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "bot",
      content: `Hi! Welcome to ${formTitle}. Let's get started! 👋`
    };
    setMessages([welcomeMessage]);

    // Ask first question after a brief delay
    setTimeout(() => {
      askNextQuestion(0);
    }, 800);
  }, []);

  // Focus input when ready
  useEffect(() => {
    if (!isComplete && !isSubmitting) {
      inputRef.current?.focus();
    }
  }, [currentFieldIndex, isComplete, isSubmitting]);

  const askNextQuestion = (index: number) => {
    if (index >= fields.length) {
      // All questions answered
      handleComplete();
      return;
    }

    const field = fields[index];
    let questionText = field.label;

    if (field.type === "select" && field.options?.length) {
      questionText += `. Options include: ${field.options.slice(0, 3).join(", ")}...`;
    }

    const questionMessage: Message = {
      id: `question-${field.id}`,
      type: "bot",
      content: questionText,
      fieldId: field.id,
    };

    setMessages((prev) => [...prev, questionMessage]);
  };

  const handleUserResponse = (response: string) => {
    const currentField = fields[currentFieldIndex];
    if (!currentField) return;

    // Add user response message
    const responseMessage: Message = {
      id: `response-${currentField.id}`,
      type: "user",
      content: response,
      fieldId: currentField.id,
    };

    setMessages((prev) => [...prev, responseMessage]);
    setResponses((prev) => ({ ...prev, [currentField.id]: response }));
    setInputValue("");

    // Move to next question after a short delay for realism
    setTimeout(() => {
      const nextIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(nextIndex);
      if (nextIndex < fields.length) {
        askNextQuestion(nextIndex);
      } else {
        handleComplete();
      }
    }, 500);
  };

  const handleComplete = () => {
    if (isComplete) return;

    setIsComplete(true);
    const completionMessage: Message = {
      id: "complete",
      type: "bot",
      content: "Thanks for completing the form! Ready to submit?",
    };

    setMessages((prev) => [...prev, completionMessage]);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(responses);

      const successMessage: Message = {
        id: "success",
        type: "bot",
        content: "✅ Submission received! You're all set.",
      };

      setMessages((prev) => [...prev, successMessage]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentField = fields[currentFieldIndex];
  const showInput = !isComplete && currentField;

  return (
    <div
      className="rounded-xl shadow-lg"
      style={{
        backgroundColor: bgColor,
        color: "#1f2933",
        minHeight: "480px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: "rgba(148, 163, 184, 0.2)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "#1f2937" }}>
          {formTitle}
        </h2>
        <p className="text-sm" style={{ color: "#475569" }}>
          Answer each question or type "skip" to move to the next one.
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(249,250,251,0.8) 100%)",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
                message.type === "user"
                  ? "text-white"
                  : "text-slate-700"
              }`}
              style={
                message.type === "user"
                  ? {
                      backgroundColor: primaryColor,
                      boxShadow: "0 8px 24px rgba(59, 130, 246, 0.24)",
                    }
                  : {
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                    }
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="p-6 border-t"
        style={{
          borderColor: "rgba(148, 163, 184, 0.2)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
      >
        {error && (
          <div className="mb-3 text-sm" style={{ color: "#ef4444" }}>
            {error}
          </div>
        )}

        {showInput ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) {
                handleUserResponse(inputValue.trim());
              }
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Reply to: ${currentField?.label}`}
                className="flex-1 px-4 py-3 text-sm rounded-xl shadow-sm"
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  backgroundColor: "rgba(255,255,255,0.94)",
                  color: "#1f2937",
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-5 py-3 text-sm font-medium rounded-xl shadow-md transition-transform disabled:opacity-40"
                style={{
                  backgroundColor: primaryColor,
                  color: "white",
                  boxShadow: "0 12px 30px rgba(59, 130, 246, 0.28)",
                  transform: inputValue.trim() ? "translateY(0)" : "translateY(2px)",
                }}
              >
                Send
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: "#64748b" }}>
              <button
                type="button"
                onClick={() => handleUserResponse("skip")}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                }}
              >
                Skip question
              </button>
              <span>Press Enter to send • Type "skip" to move on</span>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-3 text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2"
              style={{
                backgroundColor: styling?.buttonColor || primaryColor,
                color: "white",
                boxShadow: "0 12px 30px rgba(59, 130, 246, 0.28)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" variant="white" />
                  <span>Submitting...</span>
                </>
              ) : "Submit responses"}
            </button>
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentFieldIndex(0);
                setMessages((prev) => prev.slice(0, 1));
                setTimeout(() => askNextQuestion(0), 300);
              }}
              className="text-xs font-medium"
              style={{
                color: primaryColor,
              }}
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
