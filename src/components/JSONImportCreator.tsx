"use client";

import { useState } from "react";
import { FileJson, X, AlertCircle, CheckCircle, Copy, Code } from "lucide-react";
import { Field } from "@/types/form";

interface JSONImportCreatorProps {
  onFormGenerated: (title: string, fields: Field[]) => void;
  onCancel?: () => void;
}

const exampleJSON = {
  title: "Contact Form",
  fields: [
    {
      id: "full_name",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "John Doe"
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "john@example.com"
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "tel",
      required: false,
      placeholder: "+1 (555) 123-4567"
    },
    {
      id: "message",
      label: "Message",
      type: "textarea",
      required: true,
      placeholder: "Your message here..."
    },
    {
      id: "contact_method",
      label: "Preferred Contact Method",
      type: "radio",
      required: true,
      options: ["Email", "Phone", "SMS"]
    }
  ]
};

export default function JSONImportCreator({
  onFormGenerated,
  onCancel,
}: JSONImportCreatorProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyExample = () => {
    navigator.clipboard.writeText(JSON.stringify(exampleJSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseExample = () => {
    setJsonInput(JSON.stringify(exampleJSON, null, 2));
    setError(null);
  };

  const validateAndImport = () => {
    setError(null);
    setSuccess(false);

    if (!jsonInput.trim()) {
      setError("Please enter JSON data");
      return;
    }

    try {
      const data = JSON.parse(jsonInput);

      // Validate structure
      if (!data.fields || !Array.isArray(data.fields)) {
        throw new Error("JSON must contain a 'fields' array");
      }

      if (data.fields.length === 0) {
        throw new Error("Fields array cannot be empty");
      }

      // Validate each field
      const validTypes = ["text", "email", "textarea", "number", "date", "select", "radio", "checkbox", "tel", "url"];
      
      for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        
        if (!field.label) {
          throw new Error(`Field at index ${i} is missing 'label' property`);
        }

        if (field.type && !validTypes.includes(field.type)) {
          throw new Error(`Invalid field type '${field.type}' at index ${i}. Valid types: ${validTypes.join(", ")}`);
        }

        // Validate options for select/radio/checkbox
        if ((field.type === "select" || field.type === "radio" || field.type === "checkbox") && 
            (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
          throw new Error(`Field '${field.label}' requires an 'options' array`);
        }
      }

      // Normalize fields
      const normalizedFields: Field[] = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || f.label?.toLowerCase().replace(/\s+/g, "_") || `field_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
      }));

      setSuccess(true);
      setTimeout(() => {
        onFormGenerated(data.title || "Imported Form", normalizedFields);
      }, 1000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON syntax: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Invalid JSON structure");
      }
    }
  };

  const handleFormat = () => {
    try {
      const data = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(data, null, 2));
      setError(null);
    } catch {
      setError("Cannot format invalid JSON");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileJson className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Import JSON Form Structure</h2>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Developer-Friendly Import
            </h3>
            <p className="text-sm text-blue-800">
              Paste your form structure in JSON format. Perfect for importing forms from APIs,
              configuration files, or migrating from other platforms.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: JSON Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-900">
                  JSON Input
                </label>
                <button
                  onClick={handleFormat}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Format JSON
                </button>
              </div>
              
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                placeholder="Paste your JSON here..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm resize-none"
              />

              <div className="flex space-x-3">
                <button
                  onClick={validateAndImport}
                  disabled={!jsonInput.trim() || success}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {success ? "✓ Success!" : "Import & Generate Form"}
                </button>
              </div>
            </div>

            {/* Right: Example and Schema */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-900">
                  Example JSON
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyExample}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleUseExample}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use Example
                  </button>
                </div>
              </div>

              <pre className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg overflow-auto text-sm font-mono">
                {JSON.stringify(exampleJSON, null, 2)}
              </pre>

              {/* Schema documentation */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Required Structure:</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• <code className="bg-white px-1 rounded">title</code> (optional): Form title</li>
                  <li>• <code className="bg-white px-1 rounded">fields</code> (required): Array of field objects</li>
                </ul>
                
                <h4 className="font-semibold text-gray-900 mt-3 mb-2">Field Properties:</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• <code className="bg-white px-1 rounded">label</code> (required): Field label</li>
                  <li>• <code className="bg-white px-1 rounded">id</code> (optional): Unique identifier</li>
                  <li>• <code className="bg-white px-1 rounded">type</code> (optional): Field type (default: text)</li>
                  <li>• <code className="bg-white px-1 rounded">required</code> (optional): Boolean</li>
                  <li>• <code className="bg-white px-1 rounded">placeholder</code> (optional): Hint text</li>
                  <li>• <code className="bg-white px-1 rounded">options</code> (required for select/radio/checkbox)</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-3 mb-2">Valid Types:</h4>
                <div className="flex flex-wrap gap-1">
                  {["text", "email", "tel", "url", "number", "date", "textarea", "select", "radio", "checkbox"].map((type) => (
                    <code key={type} className="bg-white px-2 py-0.5 rounded text-xs">
                      {type}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Validation Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">
                  JSON validated successfully. Creating your form...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
