
// Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
export const PARSING_TIMEOUT = 30000; // 30 seconds

export interface FileAttachment {
    id: string;
    file: File;
    status: 'parsing' | 'success' | 'error';
    content?: string;
    errorMessage?: string;
}

/**
 * Formats multiple file outputs with clear delimiters for the AI
 */
export function formatFileContext(validFiles: FileAttachment[]): string {
    return validFiles
        .filter(f => f.status === 'success' && f.content)
        .map(f => `
═══════════════════════════════════════════════════════════════
FILE: ${f.file.name}
═══════════════════════════════════════════════════════════════
${f.content}
`)
        .join('\n');
}

/**
 * Parses a file with a strict timeout
 */
export async function parseFileWithTimeout(file: File): Promise<string> {
    // 1. Validation
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File is too large (max 10MB)`);
    }

    // 2. Race between parsing and timeout
    return Promise.race([
        parseFileContent(file),
        new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Parsing timed out (30s limit)')), PARSING_TIMEOUT)
        )
    ]);
}

/**
 * Internal parsing logic based on file type
 */
async function parseFileContent(file: File): Promise<string> {
    const type = file.type;

    // HANDLE PDF
    if (type === 'application/pdf') {
        return parsePdf(file);
    }

    // HANDLE IMAGE (Mock OCR)
    if (type.startsWith('image/')) {
        return mockOcr(file);
    }

    // HANDLE TEXT / JSON / CSV
    if (
        type === 'text/plain' ||
        type === 'text/csv' ||
        type === 'application/json' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json')
    ) {
        return readTextFile(file);
    }

    // Fallback for unknown types (try reading as text if likely text, otherwise error)
    throw new Error(`Unsupported file type: ${type}`);
}

// Configure worker inside the function to ensure it runs only on client
let isWorkerConfigured = false;

async function parsePdf(file: File): Promise<string> {
    try {
        // Dynamically import pdfjs-dist to avoid "DOMMatrix is not defined" during SSR/build
        const pdfjsLib = await import("pdfjs-dist");

        if (!isWorkerConfigured) {
            // Use version pinned CDN for stability
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            isWorkerConfigured = true;
        }

        const arrayBuffer = await file.arrayBuffer();

        // Load the document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Iterate over all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((item: any) => item.str)
                .join(' ');

            fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error('PDF parsing error:', error);
        // User-friendly error for worker failures
        if (error instanceof Error && error.message.includes('worker')) {
            throw new Error('PDF parsing unavailable. Please check your network connection.');
        }
        if (error instanceof Error && error.name === 'PasswordException') {
            throw new Error('PDF is password protected.');
        }
        throw new Error('Failed to parse PDF file.');
    }
}

async function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

async function mockOcr(file: File): Promise<string> {
    // Simulate delay for "scanning"
    await new Promise(resolve => setTimeout(resolve, 1500));

    return `[Image: ${file.name}]
Mock OCR output - Replace with real OCR service
Sample extracted text:
CONTACT FORM
Full Name: John Doe
Email: john@example.com
Subject: Inquiry
Message: I would like to know more about your services.`;
}
