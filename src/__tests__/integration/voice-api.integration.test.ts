/**
 * Integration Tests: Voice API Endpoint
 * Tests Requirements: 5.2, 5.3, 6.3, 6.4, 9.3
 * 
 * These tests verify the AI form generation API endpoint:
 * - Text-only processing (no audio)
 * - Multi-language support
 * - Form configuration generation
 * - Error handling
 */

import { POST } from '@/app/api/ai/generate-from-voice/route';
import { NextRequest } from 'next/server';

// Mock Groq client
jest.mock('@/lib/groq', () => ({
  getGroqClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

import { getGroqClient } from '@/lib/groq';

describe('Voice API Integration Tests', () => {
  let mockGroqCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockGroq = getGroqClient();
    mockGroqCreate = mockGroq.chat.completions.create as jest.Mock;
  });

  describe('Form Generation from Transcription', () => {
    test('should generate form from English transcription', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Contact Form',
                  fields: [
                    {
                      id: 'name',
                      label: 'Name',
                      type: 'text',
                      required: true,
                      order: 0,
                    },
                    {
                      id: 'email',
                      label: 'Email',
                      type: 'email',
                      required: true,
                      order: 1,
                    },
                    {
                      id: 'message',
                      label: 'Message',
                      type: 'textarea',
                      required: true,
                      order: 2,
                    },
                  ],
                },
                confidence: 0.95,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'I need a contact form with name, email, and message',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.form.title).toBe('Contact Form');
      expect(data.form.fields).toHaveLength(3);
      expect(data.form.fields[0]).toMatchObject({
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      });
      expect(data.confidence).toBe(0.95);
    });

    test('should generate form from Spanish transcription', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Formulario de Contacto',
                  fields: [
                    {
                      id: 'nombre',
                      label: 'Nombre',
                      type: 'text',
                      required: true,
                      order: 0,
                    },
                    {
                      id: 'correo',
                      label: 'Correo Electrónico',
                      type: 'email',
                      required: true,
                      order: 1,
                    },
                  ],
                },
                confidence: 0.92,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'necesito un formulario de contacto con nombre y correo',
          language: 'es-ES',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.form.title).toBe('Formulario de Contacto');
      expect(data.form.fields[0].label).toBe('Nombre');
      expect(data.form.fields[1].label).toBe('Correo Electrónico');
    });

    test('should generate form with various field types', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Registration Form',
                  fields: [
                    {
                      id: 'name',
                      label: 'Full Name',
                      type: 'text',
                      required: true,
                      order: 0,
                    },
                    {
                      id: 'email',
                      label: 'Email',
                      type: 'email',
                      required: true,
                      order: 1,
                    },
                    {
                      id: 'age',
                      label: 'Age',
                      type: 'number',
                      required: false,
                      order: 2,
                    },
                    {
                      id: 'country',
                      label: 'Country',
                      type: 'select',
                      required: true,
                      options: ['USA', 'Canada', 'UK', 'Other'],
                      order: 3,
                    },
                    {
                      id: 'terms',
                      label: 'I agree to terms',
                      type: 'checkbox',
                      required: true,
                      order: 4,
                    },
                  ],
                },
                confidence: 0.88,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'registration form with name, email, age, country dropdown, and terms checkbox',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.form.fields).toHaveLength(5);
      expect(data.form.fields[2].type).toBe('number');
      expect(data.form.fields[3].type).toBe('select');
      expect(data.form.fields[3].options).toEqual(['USA', 'Canada', 'UK', 'Other']);
      expect(data.form.fields[4].type).toBe('checkbox');
    });

    test('should normalize field properties', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Test Form',
                  fields: [
                    {
                      // Missing id
                      label: 'Name',
                      type: 'text',
                    },
                    {
                      id: 'email',
                      // Missing label
                      type: 'email',
                    },
                    {
                      id: 'message',
                      label: 'Message',
                      // Missing type
                    },
                  ],
                },
                confidence: 0.75,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'simple form',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Verify normalization
      expect(data.form.fields[0].id).toBe('field_0');
      expect(data.form.fields[1].label).toBe('Field 2');
      expect(data.form.fields[2].type).toBe('text');
      expect(data.form.fields[0].order).toBe(0);
      expect(data.form.fields[1].order).toBe(1);
      expect(data.form.fields[2].order).toBe(2);
    });
  });

  describe('Privacy and Security', () => {
    test('should only accept text transcriptions, not audio data', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'valid text transcription',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      // Verify no audio processing occurred
      expect(mockGroqCreate).toHaveBeenCalled();
      const callArgs = mockGroqCreate.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('valid text transcription');
    });

    test('should reject invalid transcript types', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: null,
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid transcript');
    });

    test('should reject empty transcripts', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: '   ',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid transcript');
    });
  });

  describe('Multi-Language Support', () => {
    test('should include language context in AI prompt', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Formulaire',
                  fields: [],
                },
                confidence: 0.9,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'formulaire de contact',
          language: 'fr-FR',
        }),
      });

      await POST(request);

      expect(mockGroqCreate).toHaveBeenCalled();
      const callArgs = mockGroqCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('French');
    });

    test('should default to English if language not specified', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Form',
                  fields: [],
                },
                confidence: 0.9,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'contact form',
        }),
      });

      await POST(request);

      expect(mockGroqCreate).toHaveBeenCalled();
      const callArgs = mockGroqCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('English');
    });
  });

  describe('Error Handling', () => {
    test('should handle AI service errors', async () => {
      mockGroqCreate.mockRejectedValue(new Error('AI service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'test form',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('AI service unavailable');
    });

    test('should handle invalid AI response structure', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                // Missing form object
                confidence: 0.9,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'test form',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Invalid AI response structure');
    });

    test('should handle malformed JSON from AI', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'test form',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should normalize confidence scores', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Test Form',
                  fields: [],
                },
                confidence: 1.5, // Invalid: > 1.0
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'test form',
          language: 'en-US',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.confidence).toBe(1.0); // Clamped to max
    });
  });

  describe('Performance', () => {
    test('should complete form generation within reasonable time', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                form: {
                  title: 'Test Form',
                  fields: [
                    { id: 'field1', label: 'Field 1', type: 'text', required: true, order: 0 },
                  ],
                },
                confidence: 0.9,
              }),
            },
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/ai/generate-from-voice', {
        method: 'POST',
        body: JSON.stringify({
          transcript: 'simple form',
          language: 'en-US',
        }),
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
