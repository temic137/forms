"use client";

import { useEffect, useState } from "react";

export default function AnimatedLandingDescription() {
    const words = ["forms", "quizzes", "surveys", "tests"];
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
        <p
            className="text-xl max-w-2xl mx-auto mb-8 leading-relaxed font-paper text-black/60 font-bold"
        >
            Create{" "}
            <span
                className={`transition-opacity duration-500 inline-block font-bold text-black ${fade ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {words[index]}
            </span>{" "}
            in seconds using AI. Then customize with drag-and-drop
        </p>
    );
}
