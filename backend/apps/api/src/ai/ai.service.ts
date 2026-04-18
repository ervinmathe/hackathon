import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client: OpenAI;
  private readonly model = 'llama-3.3-70b-versatile';
  
  private readonly defaultGuidelines = `
    IRÁNYELVEK:
    1. Mindig a hallgató mentális és fizikai jólétét tartsd szem előtt.
    2. Válaszolj empatikusan, de maradj szakmai.
    3. Kerüld a túl bonyolult orvosi szakzsargont, magyarázd el az alapokat.
    4. Ha a felhasználó kimerültségről beszél, javasolj konkrét pihenési technikákat.
    5. A válaszok legyenek strukturáltak és könnyen olvashatóak.
  `;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async refineQuestion(question: string, preferences?: any, customGuidelines?: string): Promise<string> {
    const userContext = preferences?.tags ? `FELHASZNÁLÓ PREFERENCIÁI: ${preferences.tags.join(', ')}` : '';
    const activeGuidelines = customGuidelines ? `${this.defaultGuidelines}\nEGYEDI IRÁNYELVEK: ${customGuidelines}` : this.defaultGuidelines;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: `${activeGuidelines}\n${userContext}\nFeladat: Alakítsd át a kérdést profibbá.` },
          { role: 'user', content: question }
        ],
      });
      return completion.choices[0]?.message?.content?.trim() || 'Nem érkezett válasz.';
    } catch (error) {
      console.error('Groq Refine Error:', error);
      return `Finomított (Fallback): ${question}`;
    }
  }

  async ask(refinedQuestion: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.defaultGuidelines },
          { role: 'user', content: refinedQuestion }
        ],
      });
      return completion.choices[0]?.message?.content?.trim() || 'Sajnálom, nem sikerült válaszolni.';
    } catch (error) {
      console.error('Groq Ask Error:', error);
      return 'Sajnálom, hiba történt a válasz generálása közben.';
    }
  }

  async extractPreferences(answers: any): Promise<string[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Válaszolj csak vesszővel elválasztott tagekkel, semmi mással.' },
          { role: 'user', content: `Elemezd ezeket a válaszokat és adj vissza tageket: ${JSON.stringify(answers)}` }
        ],
      });
      const content = completion.choices[0]?.message?.content || '';
      return content.split(',').map((t: string) => t.trim().toLowerCase());
    } catch (error) {
      return ['egészség', 'diákélet'];
    }
  }

  async matchFacilities(userTags: string[], facilities: any[]): Promise<any[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Csak JSON formátumban válaszolj: {"recommendations": [{"id": "...", "reason": "..."}]}' },
          { role: 'user', content: `Tagek: ${userTags.join(', ')}. Létesítmények: ${JSON.stringify(facilities)}` }
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
