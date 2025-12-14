"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import CollaboratorModal from "./CollaboratorModal";

export default function ShareCollaboratorButton({ formId }: { formId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        aria-label="Manage collaborators"
      >
        <Users className="w-4 h-4" />
        Collaborate
      </button>
      <CollaboratorModal
        formId={formId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}




