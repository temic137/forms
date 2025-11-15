"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";

export interface ConfirmDialogOptions {
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "warning" | "danger";
}

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback(
    (
      title: string,
      message: string,
      options: ConfirmDialogOptions = {}
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title,
          message,
          confirmText: options.confirmText || "Confirm",
          cancelText: options.cancelText || "Cancel",
          variant: options.variant || "default",
          onConfirm: () => {
            setDialogState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setDialogState((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      });
    },
    []
  );

  return { confirm, dialogState };
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          confirmButton: {
            background: "var(--error)",
            color: "#ffffff",
            border: "1px solid var(--error)",
          },
          confirmButtonHover: {
            background: "var(--error-hover, #dc2626)",
            borderColor: "var(--error-hover, #dc2626)",
          },
        };
      case "warning":
        return {
          confirmButton: {
            background: "#f59e0b",
            color: "#ffffff",
            border: "1px solid #f59e0b",
          },
          confirmButtonHover: {
            background: "#d97706",
            borderColor: "#d97706",
          },
        };
      default:
        return {
          confirmButton: {
            background: "var(--accent)",
            color: "var(--accent-dark)",
            border: "1px solid var(--accent)",
          },
          confirmButtonHover: {
            background: "var(--accent-hover, var(--accent))",
            borderColor: "var(--accent-hover, var(--accent))",
          },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(11, 12, 14, 0.75)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
      onClick={onCancel}
    >
      <div
        className="max-w-md w-full"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--card-radius-lg)",
          boxShadow: "var(--card-shadow-hover)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--divider)" }}
        >
          <h2
            id="confirmation-dialog-title"
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 transition-colors"
            style={{ color: "var(--foreground-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--background-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--foreground-muted)";
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Close confirmation dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p
            id="confirmation-dialog-message"
            className="mb-6"
            style={{ color: "var(--foreground-muted)" }}
          >
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--card-bg-hover)";
                e.currentTarget.style.borderColor = "var(--card-border-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--card-bg)";
                e.currentTarget.style.borderColor = "var(--card-border)";
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={variantStyles.confirmButton}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, variantStyles.confirmButtonHover);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, variantStyles.confirmButton);
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

