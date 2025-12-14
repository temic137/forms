"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-remove after duration
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`
        bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 mb-2
        flex items-center gap-3 min-w-[280px] sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-[500px]
        transition-all duration-300 ease-in-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
      `}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      <p className="flex-1 text-sm text-white">{toast.message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="text-neutral-500 hover:text-neutral-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.854 3.146a.5.5 0 0 0-.708 0L8 7.293 3.854 3.146a.5.5 0 1 0-.708.708L7.293 8l-4.147 4.146a.5.5 0 0 0 .708.708L8 8.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 8l4.147-4.146a.5.5 0 0 0 0-.708z" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-2 sm:right-4 z-50 flex flex-col-reverse items-end max-w-[calc(100vw-1rem)] sm:max-w-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string, duration?: number) => showToast(message, "success", duration),
    error: (message: string, duration?: number) => showToast(message, "error", duration),
    info: (message: string, duration?: number) => showToast(message, "info", duration),
    warning: (message: string, duration?: number) => showToast(message, "warning", duration),
  };
}
