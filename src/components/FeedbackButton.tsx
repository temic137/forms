"use client";

import { MessageSquare } from "lucide-react";

export default function FeedbackButton() {
    return (
        <a
            href="https://www.anyform.live/f/cmjhq1iau0001la048jmbkk50"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            aria-label="Give Feedback"
        >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
        </a>
    );
}
