"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Link as LinkIcon, FileText, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function CreateByAiPromptPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generationType, setGenerationType] = useState("form");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !file && !url) {
      alert("Please provide a prompt, file, or URL.");
      return;
    }

    setIsLoading(true);
    setStatus("Analyzing inputs...");

    try {
      let additionalContext = "";

      // Process File
      if (file) {
        setStatus("Processing file...");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/utils/parse-file", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to parse file");
        const data = await res.json();
        additionalContext += `\n\nContext from uploaded file (${file.name}):\n${data.text}`;
      }

      // Process URL
      if (url) {
        setStatus("Scraping URL...");
        const res = await fetch("/api/utils/scrape-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) throw new Error("Failed to scrape URL");
        const data = await res.json();
        additionalContext += `\n\nContext from URL (${url}):\n${data.content}`;
      }

      setStatus("Generating form structure...");
      
      // Construct the full prompt context
      const fullContent = `
User Request: Create a ${generationType}.
User Description: ${prompt}
${additionalContext}
      `.trim();

      // Call AI Generation
      const generateRes = await fetch("/api/ai/generate-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fullContent,
          sourceType: "text",
          userContext: `The user wants to create a ${generationType}.`,
          options: {
            formComplexity: "moderate",
          }
        }),
      });

      if (!generateRes.ok) throw new Error("Failed to generate form");
      const generatedData = await generateRes.json();

      setStatus("Creating form...");

      // Create Form in DB
      const createRes = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedData.title,
          fields: generatedData.fields,
          quizMode: generationType === "quiz" ? { enabled: true } : null,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to save form");
      const { id } = await createRes.json();

      setStatus("Redirecting...");
      router.push(`/builder/${id}`);

    } catch (error) {
      console.error(error);
      alert("An error occurred during generation. Please try again.");
      setIsLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create with AI
          </h1>
          <p className="mt-2 text-gray-600">
            Combine prompts, files, and URLs to generate forms, quizzes, and surveys.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          
          {/* Generation Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to create?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["form", "quiz", "survey", "questionnaire"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGenerationType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize border transition-colors ${
                    generationType === type
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your requirements
            </label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the ${generationType} you want to build...`}
              className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Additional Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File (PDF, TXT, CSV)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.csv,.json"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600 truncate">
                    {file ? file.name : "Choose file"}
                  </span>
                </label>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scrape Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {status && (
                <span className="flex items-center text-blue-600">
                  <Spinner size="sm" className="mr-2" />
                  {status}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
