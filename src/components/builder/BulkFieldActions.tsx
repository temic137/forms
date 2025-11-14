"use client";

import { Field } from '@/types/form';

interface BulkFieldActionsProps {
  selectedFields: string[];
  fields: Field[];
  onDelete: (fieldIds: string[]) => void;
  onDuplicate: (fieldIds: string[]) => void;
  onClearSelection: () => void;
}

export default function BulkFieldActions({
  selectedFields,
  fields,
  onDelete,
  onDuplicate,
  onClearSelection,
}: BulkFieldActionsProps) {
  if (selectedFields.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-40 animate-slide-in">
      <span className="text-sm font-medium">
        {selectedFields.length} field{selectedFields.length > 1 ? 's' : ''} selected
      </span>

      <div className="flex items-center gap-2 border-l border-white/20 pl-4">
        <button
          onClick={() => onDuplicate(selectedFields)}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          title="Duplicate selected fields"
        >
          Duplicate
        </button>

        <button
          onClick={() => {
            if (confirm(`Delete ${selectedFields.length} field(s)?`)) {
              onDelete(selectedFields);
            }
          }}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
          title="Delete selected fields"
        >
          Delete
        </button>

        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Clear selection"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
