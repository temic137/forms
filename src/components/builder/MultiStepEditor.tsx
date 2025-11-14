"use client";

import { useState } from "react";
import { Field, FormStep, MultiStepConfig } from "@/types/form";

interface MultiStepEditorProps {
  fields: Field[];
  config: MultiStepConfig | undefined;
  onChange: (config: MultiStepConfig | undefined) => void;
}

export default function MultiStepEditor({
  fields,
  config,
  onChange,
}: MultiStepEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const enabled = config?.enabled || false;
  const steps = config?.steps || [];

  function toggleEnabled() {
    if (enabled) {
      // Disable multi-step
      onChange(undefined);
    } else {
      // Enable with default step
      onChange({
        enabled: true,
        steps: [
          {
            id: `step_${Date.now()}`,
            title: "Step 1",
            order: 0,
            fieldIds: fields.map((f) => f.id),
          },
        ],
        showProgressBar: true,
        allowBackNavigation: true,
      });
    }
  }

  function addStep() {
    if (!config) return;
    const newStep: FormStep = {
      id: `step_${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      order: steps.length,
      fieldIds: [],
    };
    onChange({
      ...config,
      steps: [...steps, newStep],
    });
  }

  function updateStep(stepId: string, patch: Partial<FormStep>) {
    if (!config) return;
    onChange({
      ...config,
      steps: steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  }

  function removeStep(stepId: string) {
    if (!config || steps.length <= 1) return;
    const removedStep = steps.find((s) => s.id === stepId);
    const remainingSteps = steps.filter((s) => s.id !== stepId);
    
    // Reassign fields from removed step to first step
    if (removedStep && remainingSteps.length > 0) {
      remainingSteps[0].fieldIds = [
        ...remainingSteps[0].fieldIds,
        ...removedStep.fieldIds,
      ];
    }
    
    onChange({
      ...config,
      steps: remainingSteps.map((s, idx) => ({ ...s, order: idx })),
    });
  }

  function moveStepUp(stepId: string) {
    if (!config) return;
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx <= 0) return;
    
    const newSteps = [...steps];
    [newSteps[idx - 1], newSteps[idx]] = [newSteps[idx], newSteps[idx - 1]];
    
    onChange({
      ...config,
      steps: newSteps.map((s, i) => ({ ...s, order: i })),
    });
  }

  function moveStepDown(stepId: string) {
    if (!config) return;
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx < 0 || idx >= steps.length - 1) return;
    
    const newSteps = [...steps];
    [newSteps[idx], newSteps[idx + 1]] = [newSteps[idx + 1], newSteps[idx]];
    
    onChange({
      ...config,
      steps: newSteps.map((s, i) => ({ ...s, order: i })),
    });
  }

  function assignFieldToStep(fieldId: string, stepId: string) {
    if (!config) return;
    
    // Remove field from all steps
    const updatedSteps = steps.map((s) => ({
      ...s,
      fieldIds: s.fieldIds.filter((fid) => fid !== fieldId),
    }));
    
    // Add field to target step
    const targetStep = updatedSteps.find((s) => s.id === stepId);
    if (targetStep) {
      targetStep.fieldIds.push(fieldId);
    }
    
    onChange({
      ...config,
      steps: updatedSteps,
    });
  }

  function getUnassignedFields(): Field[] {
    if (!config) return [];
    const assignedFieldIds = new Set(
      steps.flatMap((s) => s.fieldIds)
    );
    return fields.filter((f) => !assignedFieldIds.has(f.id));
  }

  const unassignedFields = getUnassignedFields();

  return (
    <div className="border-t border-neutral-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black transition-colors"
        >
          <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
            ▶
          </span>
          Multi-Step Form
        </button>
        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
            className="w-4 h-4 border-neutral-300 text-black focus:ring-0 focus:ring-offset-0 rounded"
          />
          Enable
        </label>
      </div>

      {isExpanded && enabled && config && (
        <div className="pl-4 space-y-4 border-l-2 border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Steps</span>
            <button
              onClick={addStep}
              className="text-xs text-neutral-500 hover:text-black transition-colors"
            >
              + Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No steps configured</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="border border-neutral-200 rounded-lg p-3 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:border-black text-black"
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) =>
                        updateStep(step.id, { title: e.target.value })
                      }
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveStepUp(step.id)}
                        disabled={idx === 0}
                        className="text-neutral-400 hover:text-black transition-colors text-xs disabled:opacity-30"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveStepDown(step.id)}
                        disabled={idx === steps.length - 1}
                        className="text-neutral-400 hover:text-black transition-colors text-xs disabled:opacity-30"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        disabled={steps.length <= 1}
                        className="text-neutral-400 hover:text-black transition-colors text-xs disabled:opacity-30"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500">
                    <span className="font-medium">
                      {step.fieldIds.length} field{step.fieldIds.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {step.fieldIds.length > 0 && (
                    <div className="space-y-1">
                      {step.fieldIds.map((fieldId) => {
                        const field = fields.find((f) => f.id === fieldId);
                        if (!field) return null;
                        return (
                          <div
                            key={fieldId}
                            className="flex items-center justify-between text-xs bg-neutral-50 px-2 py-1 rounded"
                          >
                            <span className="text-neutral-700">{field.label}</span>
                            <button
                              onClick={() => assignFieldToStep(fieldId, "")}
                              className="text-neutral-400 hover:text-black"
                              title="Unassign"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {unassignedFields.length > 0 && (
            <div className="border border-dashed border-neutral-300 rounded-lg p-3 space-y-2">
              <span className="text-xs text-neutral-500 font-medium">
                Unassigned Fields ({unassignedFields.length})
              </span>
              <div className="space-y-1">
                {unassignedFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between text-xs bg-neutral-50 px-2 py-1 rounded"
                  >
                    <span className="text-neutral-700">{field.label}</span>
                    <select
                      onChange={(e) => assignFieldToStep(field.id, e.target.value)}
                      value=""
                      className="text-xs border border-neutral-300 rounded px-1 py-0.5"
                    >
                      <option value="">Assign to...</option>
                      {steps.map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showProgressBar}
                onChange={(e) =>
                  onChange({ ...config, showProgressBar: e.target.checked })
                }
                className="w-3.5 h-3.5 border-neutral-300 text-black focus:ring-0 focus:ring-offset-0 rounded"
              />
              Show progress bar
            </label>
            <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowBackNavigation}
                onChange={(e) =>
                  onChange({ ...config, allowBackNavigation: e.target.checked })
                }
                className="w-3.5 h-3.5 border-neutral-300 text-black focus:ring-0 focus:ring-offset-0 rounded"
              />
              Allow back navigation
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
