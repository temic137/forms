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
  const bgColor = styling?.backgroundColor || "#ffffff";
  const buttonColor = styling?.buttonColor || primaryColor;

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
      className="rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
      style={{
        backgroundColor: bgColor,
        height: "500px",
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-base font-semibold text-gray-900">
          {formTitle}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Answer each question or type "skip" to move to the next one.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.type === "user"
                  ? "text-white"
                  : "text-gray-800 bg-white border border-gray-200"
                }`}
              style={
                message.type === "user"
                  ? { backgroundColor: primaryColor }
                  : {}
              }
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {error && (
          <div className="mb-3 text-xs font-medium text-red-500 px-1">
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
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type your answer...`}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-900"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                Send
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => handleUserResponse("skip")}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip this question
              </button>
              <span className="text-[10px] text-gray-300">Press Enter to send</span>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
              style={{
                backgroundColor: buttonColor,
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
              className="text-xs font-medium text-center hover:underline"
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
