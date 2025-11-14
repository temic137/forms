"use client";

import { ConditionalRule, ConditionalOperator, Field } from "@/types/form";
import { useState } from "react";

interface ConditionalLogicEditorProps {
  fieldId: string;
  fields: Field[];
  rules: ConditionalRule[];
  onChange: (rules: ConditionalRule[]) => void;
}

export default function ConditionalLogicEditor({
  fieldId,
  fields,
  rules,
  onChange,
}: ConditionalLogicEditorProps) {
  const [isExpanded, setIsExpanded] = useState(rules.length > 0);

  // Filter out the current field from source field options
  const availableFields = fields.filter((f) => f.id !== fieldId);

  const addCondition = () => {
    const newRule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      sourceFieldId: availableFields[0]?.id || "",
      operator: "equals",
      value: "",
      action: "show",
      logicOperator: rules.length > 0 ? "AND" : undefined,
    };
    onChange([...rules, newRule]);
    setIsExpanded(true);
  };

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const updated = rules.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    );
    onChange(updated);
  };

  const removeRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    onChange(updated);
  };

  const toggleLogicOperator = (index: number) => {
    const currentOperator = rules[index].logicOperator;
    updateRule(index, {
      logicOperator: currentOperator === "AND" ? "OR" : "AND",
    });
  };

  if (availableFields.length === 0) {
    return null;
  }

  return (
    <div className="pl-4 space-y-3 border-l-2 border-neutral-200">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-neutral-500 font-medium hover:text-black transition-colors flex items-center gap-1"
        >
          <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
            ▶
          </span>
          Conditional Logic {rules.length > 0 && `(${rules.length})`}
        </button>
        {isExpanded && (
          <button
            onClick={addCondition}
            className="text-xs text-neutral-500 hover:text-black transition-colors"
          >
            + Add Condition
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No conditions set. Field is always visible.
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={rule.id} className="space-y-2">
                  {index > 0 && (
                    <button
                      onClick={() => toggleLogicOperator(index)}
                      className="text-xs font-medium text-black bg-neutral-100 px-2 py-1 rounded hover:bg-neutral-200 transition-colors"
                    >
                      {rule.logicOperator || "AND"}
                    </button>
                  )}

                  <div className="bg-neutral-50 p-3 rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">
                        Show when
                      </span>
                      <select
                        value={rule.sourceFieldId}
                        onChange={(e) =>
                          updateRule(index, { sourceFieldId: e.target.value })
                        }
                        className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black bg-white text-black"
                      >
                        {availableFields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          updateRule(index, {
                            operator: e.target.value as ConditionalOperator,
                          })
                        }
                        className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black bg-white text-black"
                      >
                        <option value="equals">equals</option>
                        <option value="notEquals">not equals</option>
                        <option value="contains">contains</option>
                        <option value="greaterThan">greater than</option>
                        <option value="lessThan">less than</option>
                        <option value="isEmpty">is empty</option>
                        <option value="isNotEmpty">is not empty</option>
                      </select>

                      {rule.operator !== "isEmpty" &&
                        rule.operator !== "isNotEmpty" && (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(index, { value: e.target.value })
                            }
                            placeholder="Value"
                            className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-black text-black"
                          />
                        )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => removeRule(index)}
                        className="text-xs text-neutral-400 hover:text-black transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
