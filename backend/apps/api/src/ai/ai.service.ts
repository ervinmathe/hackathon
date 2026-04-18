import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client: OpenAI;
  private readonly model = 'llama-3.3-70b-versatile';
  
  private readonly defaultGuidelines = `
    GUIDELINES:
    1. Always prioritize the student's mental and physical well-being.
    2. Respond with empathy but maintain professional expertise.
    3. Avoid overly complex medical jargon; explain the basics clearly.
    4. If the student mentions exhaustion, suggest concrete relaxation techniques.
    5. Ensure responses are structured, easy to read, and logically formatted.
  `;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async refineQuestion(question: string, preferences?: any, customGuidelines?: string): Promise<string> {
    if (!question || question.trim() === '') {
        return 'Please provide a valid question.';
    }

    const userContext = preferences?.tags ? `USER PREFERENCES (TAGS): ${preferences.tags.join(', ')}` : '';
    const activeGuidelines = customGuidelines 
      ? `${this.defaultGuidelines}\nCUSTOM GUIDELINES: ${customGuidelines}` 
      : this.defaultGuidelines;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: `${activeGuidelines}\n${userContext}\nRole: Academic Prompt Engineer. Task: Transform the user's question into a precise, learning-optimized prompt. Return ONLY the refined question.` 
          },
          { role: 'user', content: question.trim() }
        ],
      });
      return completion.choices[0]?.message?.content?.trim() || 'No response received.';
    } catch (error) {
      console.error('Groq Refine Error Details:', error);
      return `Finomított (Fallback): ${question}`;
    }
  }


  async ask(refinedQuestion: string): Promise<string> {
    console.log('--- Ask Step: Received refinedQuestion:', refinedQuestion);

    if (!refinedQuestion || refinedQuestion.trim() === '') {
      console.error('--- Ask ERROR: refinedQuestion is empty!');
      return 'The question is empty, please try again.';
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: `Role: Expert Academic Mentor.\n${this.defaultGuidelines}\nTask: Answer the student's question adhering strictly to the guidelines.` },
          { role: 'user', content: refinedQuestion.trim() }
        ],
      });
      
      const content = completion.choices[0]?.message?.content;
      console.log('--- Ask SUCCESS: AI responded');
      return content?.trim() || 'Sorry, failed to generate an answer.';
    } catch (error) {
      console.error('Groq Ask Error:', error);
      return 'Sorry, an error occurred while generating the response.';
    }
  }

  async extractPreferences(answers: any): Promise<string[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Extract interests/tags from the survey. Return ONLY a comma-separated list of tags.' },
          { role: 'user', content: `Analyze these survey answers and extract tags: ${JSON.stringify(answers)}` }
        ],
      });
      const content = completion.choices[0]?.message?.content || '';
      return content.split(',').map((t: string) => t.trim().toLowerCase());
    } catch (error) {
      return ['health', 'student-life'];
    }
  }

  async matchFacilities(userTags: string[], facilities: any[]): Promise<any[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Return ONLY JSON format: {"recommendations": [{"id": "...", "reason": "..."}]}' },
          { role: 'user', content: `Tags: ${userTags.join(', ')}. Facilities: ${JSON.stringify(facilities)}` }
        ],
        response_format: { type: 'json_object' }
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      const result = JSON.parse(content);
      return result.recommendations || [];
    } catch (error) {
      return [];
    }
  }
}
