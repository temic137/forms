"use client";

import { useEffect, useState } from "react";

export default function AnimatedDashboardSubtitle() {
    // Pluralized words for the subtitle context
    const words = ["forms", "quizzes", "surveys", "questionnaires"];
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
        <span>
            Manage your{" "}
            <span
                className={`transition-opacity duration-500 inline-block ${fade ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {words[index]}
            </span>{" "}
            or create a new one in seconds.
        </span>
    );
}
