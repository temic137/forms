"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, X } from "lucide-react";

export default function FeedbackButton() {
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="text-sm font-bold text-black/60 hover:text-black transition-colors flex items-center gap-2 font-paper"
                aria-label="Give Feedback"
            >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {showModal && mounted && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div
                        className="rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-hidden font-paper border-2 border-black/10 bg-white"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-black">Send Feedback</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg transition-colors hover:bg-black/5 text-black/60"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border-2 border-black/10">
                            <iframe 
                                src="https://www.anyform.live/embed/cmk0mtses0001lg04bqfc5ovy" 
                                width="100%" 
                                height="500" 
                                frameBorder="0" 
                                style={{ border: 'none', borderRadius: '8px' }}
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
