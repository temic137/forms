'use client';

import { useEffect, useState } from 'react';

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  useEffect(() => {
    if (shouldError) {
      throw new Error('This is a test error to preview the error page.');
    }
  }, [shouldError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Error Page Preview</h1>
      <p className="text-gray-600">Click the button below to trigger a test error and see the error UI.</p>
      <button
        onClick={() => setShouldError(true)}
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Trigger Error
      </button>
    </div>
  );
}
