import { contentAnalyzer } from '@/lib/content-analyzer';

describe('Enhanced Form Generation', () => {
  describe('Content Analyzer', () => {
    it('should detect healthcare domain from medical content', async () => {
      const medicalContent = `
        Patient intake form for new patients. 
        Please provide your medical history, current medications, 
        allergies, and emergency contact information.
      `;
      
      const analysis = await contentAnalyzer.analyze(medicalContent);
      
      expect(analysis.domain).toBe('healthcare');
      expect(analysis.documentType).toBe('medical_form');
      expect(analysis.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should detect registration form type', async () => {
      const registrationContent = `
        Create an account to get started. 
        We need your name, email, and password to register.
      `;
      
      const analysis = await contentAnalyzer.analyze(registrationContent);
      
      expect(analysis.documentType).toBe('registration_form');
      expect(analysis.suggestedQuestions.some(q => q.fieldType === 'email')).toBe(true);
      expect(analysis.suggestedQuestions.some(q => q.fieldType === 'password')).toBe(true);
    });

    it('should extract entities correctly', async () => {
      const contentWithEntities = `
        Contact us at support@example.com or call 555-123-4567.
        Our office is open from 9 AM to 5 PM.
      `;
      
      const analysis = await contentAnalyzer.analyze(contentWithEntities);
      
      expect(analysis.extractedEntities.some(e => 
        e.type === 'contact_info' && e.value === 'support@example.com'
      )).toBe(true);
      
      expect(analysis.extractedEntities.some(e => 
        e.type === 'contact_info' && e.value.includes('555-123-4567')
      )).toBe(true);
    });

    it('should generate logical question flow', async () => {
      const surveyContent = `
        Customer satisfaction survey. Rate your experience, 
        tell us what you liked, any issues faced, and if you'd recommend us.
      `;
      
      const analysis = await contentAnalyzer.analyze(surveyContent);
      const questions = analysis.suggestedQuestions;
      
      // Check logical ordering
      const ratingIndex = questions.findIndex(q => q.question.toLowerCase().includes('rate'));
      const recommendIndex = questions.findIndex(q => q.question.toLowerCase().includes('recommend'));
      
      expect(ratingIndex).toBeLessThan(recommendIndex); // Rating should come before recommendation
    });

    it('should avoid redundancy in questions', async () => {
      const contentWithDuplicates = `
        Please provide your email address. 
        We need your email for communication.
        Your email will be used for notifications.
      `;
      
      const analysis = await contentAnalyzer.analyze(contentWithDuplicates);
      const emailQuestions = analysis.suggestedQuestions.filter(q => 
        q.question.toLowerCase().includes('email') || q.fieldType === 'email'
      );
      
      expect(emailQuestions.length).toBe(1); // Should only have one email question
    });

    it('should adapt to different source types', async () => {
      const jsonContent = JSON.stringify({
        name: "John Doe",
        age: 30,
        preferences: ["Option A", "Option B"]
      });
      
      const analysis = await contentAnalyzer.analyze(jsonContent, {
        formComplexity: 'simple'
      });
      
      // Should not ask for information already in the JSON
      const nameQuestions = analysis.suggestedQuestions.filter(q => 
        q.question.toLowerCase().includes('name')
      );
      
      expect(nameQuestions.length).toBe(0); // Should not ask for name since it's already present
    });
  });
});

// Example test for the API endpoint
describe('Enhanced Generation API', () => {
  it('should generate form with analysis results', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Medical Intake Form',
        fields: [
          {
            id: 'full_name',
            label: 'Full Name',
            type: 'text',
            required: true
          }
        ],
        analysis: {
          documentType: 'medical_form',
          domain: 'healthcare',
          confidence: 0.95,
          summary: 'Analyzed medical form content'
        }
      })
    });

    global.fetch = mockFetch;

    const response = await fetch('/api/ai/generate-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Medical patient intake form',
        sourceType: 'text'
      })
    });

    const data = await response.json();

    expect(data.analysis).toBeDefined();
    expect(data.analysis.domain).toBe('healthcare');
    expect(data.fields.length).toBeGreaterThan(0);
  });
});




