"use client";

import { useState } from "react";
import { ValidationRule, FieldType } from "@/types/form";

interface ValidationEditorProps {
  rules: ValidationRule[];
  onChange: (rules: ValidationRule[]) => void;
  fieldLabel?: string;
  fieldType?: FieldType;
}

export default function ValidationEditor({ rules, onChange }: ValidationEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newRuleType, setNewRuleType] = useState<ValidationRule["type"]>("minLength");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleMessage, setNewRuleMessage] = useState("");

  function addRule() {
    if (!newRuleValue.trim()) {
      alert("Please enter a value for the validation rule");
      return;
    }

    const newRule: ValidationRule = {
      type: newRuleType,
      value: newRuleType === "pattern" ? newRuleValue : Number(newRuleValue),
      message: newRuleMessage.trim() || getDefaultMessage(newRuleType, newRuleValue),
    };

    onChange([...rules, newRule]);
    
    // Reset form
    setNewRuleValue("");
    setNewRuleMessage("");
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index));
  }

  function getDefaultMessage(type: ValidationRule["type"], value: string): string {
    switch (type) {
      case "minLength":
        return `Minimum length is ${value} characters`;
      case "maxLength":
        return `Maximum length is ${value} characters`;
      case "min":
        return `Minimum value is ${value}`;
      case "max":
        return `Maximum value is ${value}`;
      case "pattern":
        return "Invalid format";
      case "custom":
        return "This field is invalid";
      default:
        return "Validation failed";
    }
  }

  function getRuleLabel(type: ValidationRule["type"]): string {
    switch (type) {
      case "minLength":
        return "Min Length";
      case "maxLength":
        return "Max Length";
      case "min":
        return "Min Value";
      case "max":
        return "Max Value";
      case "pattern":
        return "Pattern (Regex)";
      case "custom":
        return "Custom";
      default:
        return type;
    }
  }

  function getValuePlaceholder(type: ValidationRule["type"]): string {
    switch (type) {
      case "minLength":
      case "maxLength":
        return "e.g., 5";
      case "min":
      case "max":
        return "e.g., 10";
      case "pattern":
        return "e.g., ^[A-Z0-9]+$";
      case "custom":
        return "Custom value";
      default:
        return "Value";
    }
  }



  return (
    <div className="pl-4 space-y-3 border-l-2 border-neutral-200">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-neutral-500 hover:text-black transition-colors font-medium flex items-center gap-1"
        >
          <span>{isExpanded ? "▼" : "▶"}</span>
          Validation Rules {rules.length > 0 && `(${rules.length})`}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Display existing rules */}
          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-neutral-50 rounded text-xs"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-neutral-700">
                      {getRuleLabel(rule.type)}: {rule.value.toString()}
                    </div>
                    <div className="text-neutral-500 italic">&quot;{rule.message}&quot;</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-neutral-400 hover:text-black transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new rule form */}
          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as ValidationRule["type"])}
              className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black bg-white text-black"
            >
              <option value="minLength">Min Length</option>
              <option value="maxLength">Max Length</option>
              <option value="min">Min Value</option>
              <option value="max">Max Value</option>
              <option value="pattern">Pattern (Regex)</option>
              <option value="custom">Custom</option>
            </select>

            <input
              type="text"
              placeholder={getValuePlaceholder(newRuleType)}
              value={newRuleValue}
              onChange={(e) => setNewRuleValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black text-black"
            />

            <input
              type="text"
              placeholder="Custom error message (optional)"
              value={newRuleMessage}
              onChange={(e) => setNewRuleMessage(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black text-black"
            />

            <button
              type="button"
              onClick={addRule}
              className="w-full px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-neutral-800 transition-colors"
            >
              Add Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
