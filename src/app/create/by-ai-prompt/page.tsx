
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
          <Textarea
            id="ai-prompt"
            placeholder="e.g., 'A simple contact form with name, email, and message fields.'"
            className="min-h-[150px] text-base"
          />
          <div className="mt-6 flex justify-end">
            <Button size="lg">
              Generate Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
