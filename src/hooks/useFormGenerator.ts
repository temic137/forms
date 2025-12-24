import { useState, useRef, useEffect, useCallback } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
    FileAttachment,
    parseFileWithTimeout,
    formatFileContext,
    MAX_TOTAL_SIZE
} from "@/lib/client-file-parser";

interface UseFormGeneratorOptions {
    onSuccess: (data: any) => void;
    confirm?: (title: string, message: string, options?: any) => Promise<boolean>;
}

export function useFormGenerator({ onSuccess, confirm }: UseFormGeneratorOptions) {
    const toast = useToastContext();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // Attachment state
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
    const [attachedUrl, setAttachedUrl] = useState<string>("");
    const [showUrlInput, setShowUrlInput] = useState(false);

    // Voice input state
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTranscriptRef = useRef<string>('');
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

    const {
        isListening,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
    } = useVoiceInput({
        continuous: true,
        interimResults: true,
        onTranscriptChange: (newTranscript) => {
            setQuery(newTranscript);
        },
    });

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files);

        if (attachedFiles.length + newFiles.length > 5) {
            toast.error("You can attach a maximum of 5 files.");
            return;
        }

        const validNewFiles: FileAttachment[] = [];

        for (const file of newFiles) {
            const isDuplicate = attachedFiles.some(f =>
                f.file.name === file.name && f.file.size === file.size
            );
            if (isDuplicate) {
                toast.warning(`${file.name} is already attached.`);
                continue;
            }

            const attachment: FileAttachment = {
                id: Math.random().toString(36).substring(7),
                file,
                status: 'parsing'
            };

            validNewFiles.push(attachment);
        }

        if (validNewFiles.length === 0) return;

        setAttachedFiles(prev => [...prev, ...validNewFiles]);

        const currentTotalSize = attachedFiles.reduce((acc, f) => acc + f.file.size, 0);
        const newTotalSize = validNewFiles.reduce((acc, f) => acc + f.file.size, 0);

        if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
            setAttachedFiles(prev => prev.filter(f => !validNewFiles.find(vf => vf.id === f.id)));
            toast.error(`Total file size exceeds 25MB limit.`);
            return;
        }

        // Trigger parsing
        validNewFiles.forEach(async (attachment) => {
            try {
                const text = await parseFileWithTimeout(attachment.file);
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attachment.id
                        ? { ...f, status: 'success', content: text }
                        : f
                ));
            } catch (error) {
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attachment.id
                        ? { ...f, status: 'error', errorMessage: error instanceof Error ? error.message : 'Parsing failed' }
                        : f
                ));
            }
        });
    };

    const removeFile = (id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    };

    const [statusMessage, setStatusMessage] = useState<string>("");

    const generateForm = useCallback(async (brief: string) => {
        if (attachedFiles.some(f => f.status === 'parsing')) {
            toast.warning("Please wait for files to finish processing.");
            return;
        }

        const failedFiles = attachedFiles.filter(f => f.status === 'error');
        if (failedFiles.length > 0 && confirm) {
            const confirmed = await confirm(
                "Parsing Errors",
                `${failedFiles.length} file(s) failed to parse. Generate form with valid files only?`,
                { variant: 'warning', confirmText: "Generate Anyway" }
            );
            if (!confirmed) return;
        }

        setLoading(true);
        setStatusMessage("Analyzing request...");

        try {
            let referenceData = "";

            const fileContext = formatFileContext(attachedFiles);
            if (fileContext) {
                setStatusMessage("Reading attached files...");
                referenceData += fileContext;
                // Add artificial delay for readability if files exist
                await new Promise(r => setTimeout(r, 800));
            }

            if (attachedUrl) {
                setStatusMessage("Scanning URL content...");
                const res = await fetch("/api/utils/scrape-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: attachedUrl }),
                });
                if (!res.ok) throw new Error("Failed to scrape URL");
                const data = await res.json();
                if (referenceData) referenceData += "\n\n";
                referenceData += `Content from URL (${attachedUrl}):\n${data.content}`;
            }

            setStatusMessage("Designing form structure...");
            const res = await fetch("/api/ai/generate-enhanced", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: brief,
                    referenceData: referenceData || undefined,
                    sourceType: "text",
                    userContext: "The user wants to create a form.",
                    options: {
                        formComplexity: "moderate",
                    }
                }),
            });

            if (!res.ok) throw new Error("Failed to generate form");

            setStatusMessage("Finalizing...");
            const data = await res.json();
            onSuccess(data);

            // Reset state
            setQuery("");
            setAttachedFiles([]);
            setAttachedUrl("");
            setShowUrlInput(false);
        } catch {
            toast.error("Failed to generate form. Please try again.");
        } finally {
            setLoading(false);
            setStatusMessage("");
        }
    }, [attachedFiles, attachedUrl, toast, confirm, onSuccess]);

    // Auto-submit effect
    useEffect(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        setAutoSubmitCountdown(null);

        if (attachedFiles.some(f => f.status === 'parsing')) return;

        if (isListening && query.trim() && query !== lastTranscriptRef.current) {
            lastTranscriptRef.current = query;
            setAutoSubmitCountdown(3);
            let countdown = 3;

            const countdownInterval = setInterval(() => {
                countdown -= 1;
                setAutoSubmitCountdown(countdown);
                if (countdown <= 0) clearInterval(countdownInterval);
            }, 1000);

            silenceTimerRef.current = setTimeout(() => {
                clearInterval(countdownInterval);
                if (query.trim()) {
                    stopListening();
                    generateForm(query);
                }
            }, 3000);

            return () => clearInterval(countdownInterval);
        }
    }, [query, isListening, stopListening, generateForm, attachedFiles]);

    const handleVoiceClick = async () => {
        if (isListening) {
            stopListening();
        } else {
            try {
                resetTranscript();
                setQuery('');
                lastTranscriptRef.current = '';
                await startListening();
            } catch (error) {
                console.error('Failed to start voice input:', error);
                toast.error('Failed to start voice input. Check permissions.');
            }
        }
    };

    const clearAttachments = () => {
        setAttachedFiles([]);
        setAttachedUrl("");
        setShowUrlInput(false);
    };

    return {
        query,
        setQuery,
        loading,
        statusMessage,
        attachedFiles,
        attachedUrl,
        setAttachedUrl,
        showUrlInput,
        setShowUrlInput,
        handleFileSelect,
        removeFile,
        clearAttachments,
        generateForm,
        handleVoiceClick,
        isListening,
        isSupported,
        autoSubmitCountdown
    };
}
