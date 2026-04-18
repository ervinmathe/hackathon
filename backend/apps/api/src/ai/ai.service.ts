import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  // Irányelvek a rendszer számára
  private readonly guidelines = `
    IRÁNYELVEK:
    1. Mindig a hallgató mentális és fizikai jólétét tartsd szem előtt.
    2. Válaszolj empatikusan, de maradj szakmai.
    3. Kerüld a túl bonyolult orvosi szakzsargont, magyarázd el az alapokat.
    4. Ha a felhasználó kimerültségről beszél, javasolj konkrét pihenési technikákat.
    5. A válaszok legyenek strukturáltak és könnyen olvashatóak.
  `;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing from .env! AI features will use fallback.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
    // Próbáljuk a legstabilabb Flash nevet
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Finomítja a felhasználó kérdését az irányelvek figyelembevételével.
   */
  async refineQuestion(question: string): Promise<string> {
    const prompt = `
      ${this.guidelines}
      
      SZEREPKÖR: Te egy egészségügyi Prompt Engineer vagy.
      FELADAT: Alakítsd át az alábbi felhasználói kérdést egy professzionálisabb, az IRÁNYELVEKNEK megfelelő kérdéssé.
      CSAK a finomított kérdést add vissza!
      
      FELHASZNÁLÓ KÉRDÉSE: "${question}"
      FINOMÍTOTT KÉRDÉS:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
         return `(MOCK) Refined for guidelines: ${question}`;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Refine Error:', error);
      return `Finomított (Fallback): ${question}`;
    }
  }

  /**
   * Megválaszolja a finomított kérdést az irányelvek mentén.
   */
  async ask(refinedQuestion: string): Promise<string> {
    const prompt = `
      ${this.guidelines}
      
      SZEREPKÖR: Szakértő egészségügyi mentor.
      FELADAT: Válaszold meg az alábbi finomított kérdést az IRÁNYELVEK szigorú betartásával.
      
      KÉRDÉS: "${refinedQuestion}"
      VÁLASZ:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
        return `(MOCK) Ez egy szimulált válasz, mert nincs GEMINI_API_KEY beállítva. A kérdésed: ${refinedQuestion}`;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Ask Error:', error);
      return 'Sajnálom, hiba történt a válasz generálása közben.';
    }
  }

  /**
   * Kulcsszavak/Tagek kinyerése a kérdőív válaszaiból.
   */
  async extractPreferences(answers: any): Promise<string[]> {
    const prompt = `
      FELADAT: Elemezd az alábbi kérdőív válaszait és adj vissza egy vesszővel elválasztott listát a felhasználó érdeklődési köreiről (tagek).
      PÉLDA: "alvás, stresszkezelés, jóga, futás"
      
      VÁLASZOK: ${JSON.stringify(answers)}
      TAGEK:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
        return ['egészség', 'diákélet']; // Mock tags
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().split(',').map((tag: string) => tag.trim().toLowerCase());
    } catch (error) {
      return ['general'];
    }
  }
}
