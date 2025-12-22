"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function AnimatedFormTitle() {
    const words = ["Form", "Quiz", "Survey", "Questionnaire"];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // Start fading out
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % words.length);
                setFade(true); // Fade back in with new word
            }, 500); // Wait for fade out to complete (0.5s)
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-medium flex items-center gap-1" style={{ color: 'var(--foreground)' }}>
                Create a
                <span
                    className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
                >
                    {words[index]}
                </span>
            </h2>
        </div>
    );
}
