"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Field, FieldType } from "@/types/form";
import { Spinner } from "@/components/ui/Spinner";
import { Send, UploadCloud, Check, ChevronRight, X, User, Bot, AlertCircle, RefreshCw, Paperclip } from "lucide-react";
import FileUpload, { FileMetadata } from "@/components/FileUpload";
import { validateField } from "@/lib/validation";

interface Message {
  id: string;
  sender: "bot" | "user";
  content: React.ReactNode;
  timestamp: Date;
  isTyping?: boolean;
}

interface ConversationalFormProps {
  fields: Field[];
  formTitle: string;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  styling?: {
    primaryColor?: string;
    backgroundColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    fontFamily?: string;
    headerImage?: string;
  };
}

export default function ConversationalForm({
  fields: initialFields,
  formTitle,
  onSubmit,
  styling
}: ConversationalFormProps) {
  // Filter out display-only fields that don't need user input
  const fields = useMemo(() => initialFields.filter(f => 
    !["divider", "spacer", "image", "video", "display-text", "paragraph", "heading", "h1", "banner"].includes(f.type)
  ), [initialFields]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Styles
    const primaryColor = styling?.primaryColor || "#000000";
    const backgroundColor = styling?.backgroundColor || "#ffffff";
    const buttonColor = styling?.buttonColor || "#000000";
    const buttonTextColor = styling?.buttonTextColor || "#ffffff";
    const rawFontFamily = styling?.fontFamily || "system";

    // Helper to get font family string (reused from FieldRenderer logic)
    const getFontFamily = (family: string) => {
        switch (family) {
            case "sans": return "ui-sans-serif, system-ui, sans-serif";
            case "serif": return "ui-serif, Georgia, serif";
            case "mono": return "ui-monospace, monospace";
            case "inter": return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            case "roboto": return '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            case "open-sans": return '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            case "lato": return '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            case "montserrat": return '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            case "playfair": return '"Playfair Display", "Times New Roman", serif';
            case "merriweather": return '"Merriweather", "Times New Roman", serif';
            case "arial": return "Arial, Helvetica, sans-serif";
            case "georgia": return "Georgia, serif";
            case "times": return '"Times New Roman", Times, serif';
            case "courier": return '"Courier New", Courier, monospace';
            case "poppins": return '"Poppins", sans-serif';
            case "raleway": return '"Raleway", sans-serif';
            case "nunito": return '"Nunito", sans-serif';
            case "rubik": return '"Rubik", sans-serif';
            case "pt-serif": return '"PT Serif", serif';
            case "source-serif": return '"Source Serif Pro", serif';
            case "fira-code": return '"Fira Code", monospace';
            case "jetbrains-mono": return '"JetBrains Mono", monospace';
            case "patrick-hand": return '"Patrick Hand", cursive';
            case "system":
            default:
                return "system-ui, -apple-system, sans-serif";
        }
    };

    const fontFamily = getFontFamily(rawFontFamily);

    // Helper to determine if a color is light
    const isLight = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 128;
    };

    const isBackgroundLight = isLight(backgroundColor);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
             const behavior = messages.length <= 1 ? "auto" : "smooth";
             messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initial Welcome
    const hasInitialized = useRef(false);
    useEffect(() => {
        if (!hasInitialized.current && fields.length > 0) {
            hasInitialized.current = true;
            addBotMessage(
                <div className="space-y-2">
                    <p className="font-semibold text-lg">Hi there! 👋</p>
                    <p>Welcome to <span className="font-bold">{formTitle}</span>.</p>
                </div>, 
                500
            );
            setTimeout(() => {
                askNextQuestion(0);
            }, 1200);
        }
    }, [fields.length, formTitle]);

    // Auto-focus input
    useEffect(() => {
        if (!isTyping && !isCompleted && !isSubmitting) {
            const timeout = setTimeout(() => {
                inputRef.current?.focus();
                textareaRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [currentFieldIndex, isTyping, isCompleted]);

    const addBotMessage = (content: React.ReactNode, delay = 0) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    sender: "bot",
                    content,
                    timestamp: new Date()
                }
            ]);
        }, delay);
    };

    const addUserMessage = (content: React.ReactNode) => {
        setMessages(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                sender: "user",
                content,
                timestamp: new Date()
            }
        ]);
    };

    const askNextQuestion = (index: number) => {
        if (index >= fields.length) {
            handleCompletion();
            return;
        }

        const field = fields[index];
        const label = field.label;
        
        addBotMessage(
            <div className="flex flex-col gap-2">
                <span className="text-base font-medium leading-relaxed">
                    {label}
                    {field.required && <span className="text-red-500 ml-1" title="Required">*</span>}
                </span>
                {field.helpText && (
                    <span className="text-sm opacity-70 bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg inline-block w-fit">
                        {field.helpText}
                    </span>
                )}
            </div>,
            600
        );
    };

    const handleAnswer = async (value: any, displayValue?: React.ReactNode) => {
        const field = fields[currentFieldIndex];
        
        // Validation
        const error = validateField(value, field.validation || []);
        if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
            setValidationError("This field is required.");
            return;
        }
        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError(null);
        setAnswers(prev => ({ ...prev, [field.id]: value }));
        addUserMessage(displayValue || String(value));
        setInputValue("");

        const nextIndex = currentFieldIndex + 1;
        setCurrentFieldIndex(nextIndex);
        askNextQuestion(nextIndex);
    };

    const handleCompletion = () => {
        setIsCompleted(true);
        addBotMessage(
            <div className="flex flex-col gap-4">
                <span className="text-lg">Thank you! I've collected all your responses.</span>
                <button
                    onClick={() => submitForm()}
                    className="group relative w-full overflow-hidden rounded-xl bg-black px-6 py-3.5 text-white shadow-lg transition-all hover:bg-gray-900 hover:shadow-xl active:scale-95"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                    <div className="relative z-10 flex items-center justify-center gap-2 font-semibold">
                        Complete Submission 
                        <Check size={18} className="transition-transform group-hover:scale-110" />
                    </div>
                </button>
            </div>,
            500
        );
    };

    const submitForm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            await onSubmit(answers);
            setMessages(prev => [
                ...prev,
                {
                    id: "final-success",
                    sender: "bot",
                    content: "✅ Received! Thank you for your time.",
                    timestamp: new Date()
                }
            ]);
        } catch (error) {
            addBotMessage("❌ Something went wrong submitting your form. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Render Input Area based on Field Type
    const renderInputArea = () => {
        if (isCompleted) return null;
        
        const field = fields[currentFieldIndex];
        if (!field) return null;

        // 1. Picture Choice (Visual Grid)
        if (field.type === "picture-choice") {
             return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {(field.options || []).map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt, opt)}
                            className="group relative p-3 rounded-2xl border border-black/10 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-black/20 hover:shadow-md active:scale-95 hover:-translate-y-0.5 overflow-hidden flex flex-col"
                            style={{ fontFamily }}
                        >
                            <div className="aspect-square w-full mb-3 bg-gray-50 rounded-xl overflow-hidden border border-black/5 relative">
                                {field.optionImages?.[i] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={field.optionImages[i]} 
                                        alt={opt} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300 bg-gray-50">
                                        <span className="text-3xl opacity-50">🖼️</span>
                                    </div>
                                )}
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                            </div>
                            <span className="text-center font-bold text-gray-900 px-1">{opt}</span>
                        </button>
                    ))}
                </div>
            );
        }

        // 2. Choice Inputs (Buttons)
        if (["multiple-choice", "radio", "choices", "dropdown"].includes(field.type)) {
            return (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {(field.options || []).map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt, opt)}
                            className="group relative px-5 py-2.5 rounded-xl border border-black/10 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-black/20 hover:shadow-md active:scale-95 hover:-translate-y-0.5"
                            style={{ 
                                fontFamily 
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                     {field.allowOther && (
                         <div className="flex gap-2 w-full mt-2">
                             <input
                                type="text"
                                placeholder="Other..."
                                className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 shadow-sm transition-all"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && inputValue.trim()) {
                                        handleAnswer(inputValue, inputValue);
                                    }
                                }}
                                style={{ fontFamily }}
                             />
                             <button 
                                onClick={() => inputValue.trim() && handleAnswer(inputValue, inputValue)}
                                disabled={!inputValue.trim()}
                                className="p-3 rounded-xl bg-black text-white shadow-md disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                             >
                                 <Send size={18} />
                             </button>
                         </div>
                     )}
                </div>
            );
        }

        // 2. Multi-Select (Checkboxes)
        if (["checkboxes", "multiselect"].includes(field.type)) {
            const currentSelection: string[] = Array.isArray(inputValue) ? inputValue : [];
            
            const toggleOption = (opt: string) => {
                if (currentSelection.includes(opt)) {
                    setInputValue((prev) => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        return prevArray.filter((v: string) => v !== opt) as any;
                    });
                } else {
                    setInputValue((prev) => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        return [...prevArray, opt] as any;
                    });
                }
            };

            return (
                <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="flex flex-wrap gap-2">
                        {(field.options || []).map((opt, i) => {
                            const isSelected = currentSelection.includes(opt);
                            return (
                                <button
                                    key={i}
                                    onClick={() => toggleOption(opt)}
                                    className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-medium text-sm shadow-sm ${
                                        isSelected 
                                            ? "bg-black text-white border-black transform -translate-y-0.5 shadow-md" 
                                            : "bg-white text-gray-700 border-black/10 hover:border-black/20 hover:bg-gray-50"
                                    }`}
                                    style={isSelected ? { backgroundColor: buttonColor, borderColor: buttonColor, color: buttonTextColor } : {}}
                                >
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => handleAnswer(currentSelection, currentSelection.join(", "))}
                        disabled={currentSelection.length === 0}
                        className="w-full py-3.5 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                        Confirm Selection <ChevronRight size={18} />
                    </button>
                </div>
            );
        }

        // 3. Boolean (Checkbox/Switch)
        if (["checkbox", "switch"].includes(field.type)) {
            return (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {["Yes", "No"].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleAnswer(opt === "Yes", opt)}
                            className="group relative px-6 py-3 rounded-xl border border-black/10 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-black/20 hover:shadow-md active:scale-95 hover:-translate-y-0.5"
                            style={{ fontFamily }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        }

        // 4. File Upload
        if (["file", "file-uploader"].includes(field.type)) {
            return (
                <div className="w-full bg-white rounded-2xl border border-black/10 p-1 shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="p-4 border border-dashed border-black/20 rounded-xl bg-gray-50/50">
                        <FileUpload
                            fieldId={field.id}
                            formId="conversational-temp"
                            submissionId="temp"
                            config={field.fileConfig || { acceptedTypes: "all", maxSizeMB: 10, multiple: false }}
                            onChange={(urls) => {
                                if (urls && urls.length > 0) {
                                    handleAnswer(urls, `Uploaded ${urls.length} file(s)`);
                                }
                            }}
                        />
                    </div>
                    <div className="text-center pb-2 pt-1">
                        <button 
                            onClick={() => handleAnswer([], "Skipped upload")} 
                            className="text-xs text-gray-400 hover:text-gray-600 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Skip upload
                        </button>
                    </div>
                </div>
            );
        }

        // 5. Rating / Opinion Scale / Slider / Ranking
        if (["star-rating", "rating", "opinion-scale", "number", "slider", "ranking"].includes(field.type)) {
            // @ts-ignore - "rating" might not be in generic Field type but is handled here for backward compatibility
            if (field.type === "star-rating" || field.type === "rating") {
                return (
                    <div className="flex gap-1 justify-center py-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => handleAnswer(star, "★".repeat(star))}
                                className="p-2 text-4xl text-gray-200 transition-all hover:scale-110 hover:text-yellow-400 active:scale-95"
                            >
                                ★
                            </button>
                        ))}
                    </div>
                );
            }
            if (field.type === "opinion-scale") {
                return (
                    <div className="flex flex-wrap gap-1 justify-center py-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        {Array.from({ length: 11 }, (_, i) => i).map(num => (
                            <button
                                key={num}
                                onClick={() => handleAnswer(num, String(num))}
                                className="w-10 h-10 rounded-lg border border-black/10 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-black hover:text-white hover:border-black active:scale-95"
                                style={{ fontFamily }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                );
            }
            if (field.type === "slider") {
                // @ts-ignore - min/max might not be in generic Field type but are in specific types
                const min = field.min || 0;
                // @ts-ignore
                const max = field.max || 100;
                // @ts-ignore
                const step = field.step || 1;
                 return (
                     <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white p-4 rounded-xl border border-black/10">
                        <div className="text-center font-bold text-2xl">{inputValue || min}</div>
                         <input 
                             type="range" 
                             min={min} 
                             max={max} 
                             step={step}
                             value={inputValue || min}
                             onChange={(e) => setInputValue(e.target.value)}
                             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                             style={{ accentColor: buttonColor }}
                         />
                          <button
                            onClick={() => handleAnswer(inputValue || min)}
                            className="w-full py-3.5 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        >
                            Confirm <ChevronRight size={18} />
                        </button>
                     </div>
                 )
             }
             if (field.type === "ranking") {
                 const [ranking, setRanking] = useState<string[]>([]);
                 const availableOptions = (field.options || []).filter(opt => !ranking.includes(opt));
                 
                 return (
                    <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                         {/* Selected Ranks */}
                         <div className="space-y-2">
                            {ranking.map((opt, i) => (
                                <div key={opt} className="flex items-center gap-2 p-3 bg-black text-white rounded-xl shadow-md animate-in fade-in slide-in-from-bottom-2">
                                    <span className="font-bold text-lg min-w-[24px]">{i + 1}</span>
                                    <span className="flex-1">{opt}</span>
                                    <button 
                                        onClick={() => setRanking(prev => prev.filter(p => p !== opt))}
                                        className="p-1 hover:bg-white/20 rounded-full"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                         </div>
                         
                         {/* Available Options */}
                         <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
                             <div className="w-full text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                 Tap to rank
                             </div>
                             {availableOptions.map((opt) => (
                                 <button
                                     key={opt}
                                     onClick={() => setRanking(prev => [...prev, opt])}
                                     className="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-black/20 hover:shadow-md active:scale-95 hover:-translate-y-0.5"
                                     style={{ fontFamily }}
                                 >
                                     {opt}
                                 </button>
                             ))}
                         </div>
                         
                         <button
                             onClick={() => handleAnswer(ranking, ranking.join(", "))}
                             disabled={availableOptions.length > 0} // Require ranking all? Or make it optional? Usually ranking requires ranking all.
                             className="w-full py-3.5 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                             style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                         >
                             Confirm Ranking <ChevronRight size={18} />
                         </button>
                    </div>
                 );
             }
        }

        // 6. Date Range
        if (field.type === "date-range") {
            const [startDate, setStartDate] = useState("");
            const [endDate, setEndDate] = useState("");

            return (
                <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white p-4 rounded-xl border border-black/10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                             <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all"
                             />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                             <input 
                                type="date" 
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all"
                             />
                        </div>
                    </div>
                    <button
                        onClick={() => handleAnswer({ startDate, endDate }, `${startDate} to ${endDate}`)}
                        disabled={!startDate || !endDate}
                        className="w-full py-3.5 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                        Confirm Dates <ChevronRight size={18} />
                    </button>
                </div>
            );
        }

        // 7. Address
        if (field.type === "address") {
             const [address, setAddress] = useState({
                 street: "",
                 city: "",
                 state: "",
                 zip: "",
                 country: ""
             });
             
             const updateAddress = (key: string, value: string) => {
                 setAddress(prev => ({ ...prev, [key]: value }));
             };

             const isComplete = address.street && address.city && address.zip; // Basic validation

             return (
                 <div className="w-full space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white p-4 rounded-2xl border border-black/10 shadow-sm">
                     <input 
                        placeholder="Street Address"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        value={address.street}
                        onChange={(e) => updateAddress("street", e.target.value)}
                     />
                     <div className="grid grid-cols-2 gap-3">
                         <input 
                            placeholder="City"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={address.city}
                            onChange={(e) => updateAddress("city", e.target.value)}
                         />
                         <input 
                            placeholder="State / Province"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={address.state}
                            onChange={(e) => updateAddress("state", e.target.value)}
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <input 
                            placeholder="ZIP / Postal Code"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={address.zip}
                            onChange={(e) => updateAddress("zip", e.target.value)}
                         />
                         <input 
                            placeholder="Country"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={address.country}
                            onChange={(e) => updateAddress("country", e.target.value)}
                         />
                     </div>
                     <button
                        onClick={() => handleAnswer(address, `${address.street}, ${address.city}...`)}
                        disabled={!isComplete}
                        className="w-full py-3.5 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                        Confirm Address <ChevronRight size={18} />
                    </button>
                 </div>
             );
        }

        // 8. Default Text/Date Input
        const isLongText = field.type === "long-answer" || field.type === "textarea";
        
        let inputType = "text";
        if (field.type === "email") inputType = "email";
        else if (field.type === "number" || field.type === "currency") inputType = "number";
        else if (field.type === "date" || field.type === "date-picker") inputType = "date";
        else if (field.type === "time" || field.type === "time-picker") inputType = "time";
        else if (field.type === "datetime-picker") inputType = "datetime-local";
        else if (field.type === "phone") inputType = "tel";

        return (
            <div className="flex gap-2 w-full items-end animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="relative flex-1">
                    {isLongText ? (
                        <textarea
                            ref={textareaRef}
                            value={inputValue as string}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (inputValue.trim()) handleAnswer(inputValue);
                                }
                            }}
                            placeholder="Type here..."
                            rows={1}
                            className="w-full px-5 py-3.5 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 shadow-sm transition-all resize-none"
                            style={{ fontFamily }}
                        />
                    ) : (
                        <div className="relative">
                            {field.type === "currency" && (
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            )}
                            <input
                                ref={inputRef}
                                type={inputType}
                                value={inputValue as string}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && inputValue.trim()) {
                                        handleAnswer(inputValue);
                                    }
                                }}
                                placeholder={field.placeholder || "Type here..."}
                                className={`w-full ${field.type === "currency" ? "pl-8" : "px-5"} py-3.5 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 shadow-sm transition-all`}
                                style={{ fontFamily }}
                            />
                        </div>
                    )}
                </div>
                <button
                    disabled={!inputValue || (typeof inputValue === "string" && !inputValue.trim())}
                    onClick={() => handleAnswer(inputValue)}
                    className="p-3.5 rounded-2xl bg-black text-white shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                    <Send size={20} />
                </button>
            </div>
        );
    };

    const progress = Math.min(((currentFieldIndex) / fields.length) * 100, 100);

    return (
        <div 
            className="flex flex-col h-screen w-full mx-auto max-w-3xl relative overflow-hidden font-sans"
            style={{ 
                fontFamily: (fontFamily as string) !== "inherit" ? fontFamily : undefined,
                backgroundColor: backgroundColor
            }}
        >
            {/* Header */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-black/5">
                <div className="px-6 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div>
                             <h1 className="font-bold text-base text-gray-900 leading-tight">{formTitle}</h1>
                         </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                         <div className="text-sm font-bold text-gray-900">
                             {Math.round(progress)}%
                         </div>
                     </div>
                </div>
                <div className="h-0.5 w-full bg-gray-100/50">
                    <div 
                        className="h-full transition-all duration-700 ease-out rounded-r-full"
                        style={{ width: `${progress}%`, backgroundColor: primaryColor }}
                    />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-4 fade-in duration-500`}
                    >
                        <div className={`flex max-w-[85%] sm:max-w-[75%] items-end gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Bubble */}
                            <div
                                className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm relative group ${
                                    msg.sender === "user"
                                        ? "bg-black text-white rounded-[20px] rounded-br-[4px]"
                                        : "bg-white text-gray-800 border border-black/5 rounded-[20px] rounded-bl-[4px]"
                                }`}
                                style={msg.sender === "user" ? { 
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor
                                } : {}}
                            >
                                {msg.content}
                                <span className={`absolute bottom-1 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity ${
                                    msg.sender === "user" ? "left-0 -translate-x-full pr-2 text-gray-400" : "right-0 translate-x-full pl-2 text-gray-400"
                                }`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-end gap-3">
                            <div className="px-4 py-3 bg-white border border-black/5 rounded-[20px] rounded-bl-[4px] shadow-sm flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="bg-gradient-to-t from-white via-white to-white/0 pt-8 pb-8 px-4 sm:px-6 safe-area-bottom z-10">
                {validationError && (
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50/90 backdrop-blur border border-red-100 px-4 py-3 rounded-xl animate-in slide-in-from-bottom-2 mx-auto max-w-2xl shadow-sm">
                        <AlertCircle size={18} />
                        {validationError}
                    </div>
                )}
                
                <div className="max-w-2xl mx-auto w-full transition-all duration-300">
                    {renderInputArea()}
                </div>

                {/* Branding / Footer */}
                <div className="mt-6 text-center opacity-0 hover:opacity-100 transition-opacity duration-500 delay-1000">
                     <p className="text-[10px] text-gray-300 font-medium flex items-center justify-center gap-1.5">
                        Powered by <span className="font-bold text-gray-400">AnyForm</span>
                     </p>
                </div>
            </div>
        </div>
    );
}
