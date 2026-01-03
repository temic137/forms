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
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in font-paper">
            <div
                className="bg-white rounded-2xl max-w-sm w-full p-0 relative animate-scale-in overflow-hidden border-2 border-black/10 shadow-none"
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black/10">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-black/5 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" />
                        </div>
                        <h2 className="text-lg font-bold text-black">
                            Form Saved
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors text-black/60 hover:text-black"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Dense Content Body */}
                <div className="p-4 space-y-3">
                    <p className="text-sm text-black/60">
                        <span className="font-bold text-black">{formTitle}</span> is ready to accept responses.
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
                    <div className="flex gap-3 text-sm font-bold">
                        <Link
                            href={`/f/${formId}`}
                            target="_blank"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border-2 border-black/10 transition-colors hover:border-black/30 text-black bg-white"
                        >
                            <Globe className="w-4 h-4" />
                            View Live
                        </Link>

                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-full text-center hover:bg-black/5 transition-colors text-black/60 hover:text-black"
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
