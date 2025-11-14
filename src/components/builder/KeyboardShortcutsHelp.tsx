"use client";

import { useState, useEffect } from 'react';
import { KeyboardShortcut } from '@/hooks/useBuilderKeyboardShortcuts';

export default function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 bg-black text-white rounded-full shadow-lg hover:bg-neutral-800 transition-colors z-40"
        title="Keyboard shortcuts (Press ?)"
        aria-label="Show keyboard shortcuts"
      >
        <KeyboardIcon />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-black"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-auto">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <span className="text-sm text-neutral-700">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.ctrl && (
                      <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono">
                        Ctrl
                      </kbd>
                    )}
                    {shortcut.shift && (
                      <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono">
                        Shift
                      </kbd>
                    )}
                    {shortcut.alt && (
                      <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono">
                        Alt
                      </kbd>
                    )}
                    <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-600">
                💡 Press <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-xs">?</kbd> anytime to see this help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KeyboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}
