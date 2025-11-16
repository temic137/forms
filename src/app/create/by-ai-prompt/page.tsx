export default function CreateByAiPromptPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create a Form with AI
          </h1>
          <p className="mt-2 text-gray-600">
            Describe the form you want to build, and our AI will generate it for you.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Your Form Description
          </label>
          <textarea
            id="ai-prompt"
            placeholder="e.g., 'A simple contact form with name, email, and message fields.'"
            className="w-full min-h-[150px] rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Generate Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
