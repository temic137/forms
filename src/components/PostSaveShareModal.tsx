"use client";

import { createPortal } from "react-dom";
import { Check, X, ArrowRight, Globe, Copy } from "lucide-react";
import ShareButton from "./ShareButton";
import Link from "next/link";
import { useState } from "react";

interface PostSaveShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string;
    formTitle: string;
    isPublished: boolean;
}

export default function PostSaveShareModal({
    isOpen,
    onClose,
    formId,
    formTitle,
}: PostSaveShareModalProps) {
    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-0 relative animate-scale-in overflow-hidden"
                style={{
                    background: 'var(--background)',
                    borderColor: 'var(--card-border)',
                    borderWidth: '1px'
                }}
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            Form Saved
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--foreground-muted)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Dense Content Body */}
                <div className="p-4 space-y-3">
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{formTitle}</span> is ready to accept responses.
                    </p>

                    {/* Primary Action: Share */}
                    <div className="p-0.5"> {/* Wrapper to avoid margin collapse issues if any */}
                        <ShareButton
                            url={`/f/${formId}`}
                            formTitle={formTitle}
                            label="Share Form"
                            variant="default"
                            size="sm"
                            className="w-full [&>button]:w-full [&>button]:justify-center"
                        />
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="flex gap-2 text-xs">
                        <Link
                            href={`/f/${formId}`}
                            target="_blank"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                            style={{
                                borderColor: 'var(--card-border)',
                                color: 'var(--foreground)'
                            }}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            View Live
                        </Link>

                        <button
                            onClick={onClose}
                            className="flex-1 py-2 rounded-lg text-center hover:bg-black/5 transition-colors"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
