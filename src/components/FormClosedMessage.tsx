import { AlertCircle } from "lucide-react";

interface FormClosedMessageProps {
    message?: string | null;
}

export default function FormClosedMessage({ message }: FormClosedMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Form Closed</h2>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {message || "This form is no longer accepting responses."}
            </p>
        </div>
    );
}
