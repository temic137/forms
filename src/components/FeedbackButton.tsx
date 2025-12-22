"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                aria-label="Give Feedback"
            >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
                        style={{ background: "rgba(11, 12, 14, 0.75)" }}
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setIsOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
                            style={{
                                background: "var(--card-bg, #ffffff)",
                                border: "1px solid var(--card-border, #e5e7eb)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Share Feedback</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="w-full bg-white">
                                <iframe
                                    src="https://www.anyform.live/embed/cmjhq1iau0001la048jmbkk50"
                                    width="100%"
                                    height="600"
                                    frameBorder="0"
                                    style={{ border: "none" }}
                                    title="Feedback Form"
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
