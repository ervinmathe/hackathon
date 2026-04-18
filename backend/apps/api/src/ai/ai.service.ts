import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  private readonly defaultGuidelines = `
    IRÁNYELVEK:
    1. Mindig a hallgató mentális és fizikai jólétét tartsd szem előtt.
    2. Válaszolj empatikusan, de maradj szakmai.
    3. Kerüld a túl bonyolult orvosi szakzsargont, magyarázd el az alapokat.
    4. Ha a felhasználó kimerültségről beszél, javasolj konkrét pihenési technikákat.
    5. A válaszok legyenek strukturáltak és könnyen olvashatóak.
  `;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Finomítja a felhasználó kérdését az irányelvek és a preferenciák figyelembevételével.
   */
  async refineQuestion(question: string, preferences?: any, customGuidelines?: string): Promise<string> {
    const userContext = preferences && preferences.tags 
      ? `FELHASZNÁLÓ PREFERENCIÁI (TAGEK): ${preferences.tags.join(', ')}`
      : '';

    const activeGuidelines = customGuidelines 
      ? `${this.defaultGuidelines}\nEGYEDI IRÁNYELVEK: ${customGuidelines}` 
      : this.defaultGuidelines;

    const prompt = `
      ${activeGuidelines}
      
      ${userContext}
      
      SZEREPKÖR: Te egy egészségügyi Prompt Engineer vagy.
      FELADAT: Alakítsd át az alábbi felhasználói kérdést egy professzionálisabb, az IRÁNYELVEKNEK és a FELHASZNÁLÓI PREFERENCIÁKNAK megfelelő kérdéssé.
      Ha vannak preferenciák, próbáld beleszőni őket (pl. ha szeret jógázni, a kérdés kérdezzen rá a jógára is).
      CSAK a finomított kérdést add vissza!
      
      FELHASZNÁLÓ KÉRDÉSE: "${question}"
      FINOMÍTOTT KÉRDÉS:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
         return `(MOCK) Refined with prefs [${preferences?.tags || 'none'}]: ${question}`;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Refine Error:', error);
      return `Finomított (Fallback): ${question}`;
    }
  }

  async ask(refinedQuestion: string): Promise<string> {
    const prompt = `
      ${this.defaultGuidelines}
      SZEREPKÖR: Szakértő egészségügyi mentor.
      FELADAT: Válaszold meg az alábbi finomított kérdést az IRÁNYELVEK szigorú betartásával.
      KÉRDÉS: "${refinedQuestion}"
      VÁLASZ:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
        return `(MOCK) Answer for: ${refinedQuestion}`;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Ask Error:', error);
      return 'Sajnálom, hiba történt a válasz generálása közben.';
    }
  }

  async extractPreferences(answers: any): Promise<string[]> {
    const prompt = `
      FELADAT: Elemezd az alábbi kérdőív válaszait és adj vissza egy vesszővel elválasztott listát a felhasználó érdeklődési köreiről (tagek).
      PÉLDA: "alvás, stresszkezelés, jóga, futás"
      VÁLASZOK: ${JSON.stringify(answers)}
      TAGEK:
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
        return ['alvás', 'stresszkezelés'];
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().split(',').map((tag: string) => tag.trim().toLowerCase());
    } catch (error) {
      return ['general'];
    }
  }

  /**
   * Létesítmények és felhasználói preferenciák párosítása.
   */
  async matchFacilities(userTags: string[], facilities: any[]): Promise<any[]> {
    const prompt = `
      FELHASZNÁLÓ TAGEK: ${userTags.join(', ')}
      LÉTESÍTMÉNYEK: ${JSON.stringify(facilities.map(f => ({ id: f.id, name: f.name, tags: f.tags })))}
      
      FELADAT: Rangsorold a fenti létesítményeket a felhasználói tagek alapján. 
      Csak azokat a létesítményeket add vissza JSON listában, amik relevánsak. 
      Minden elem tartalmazza: { "id": "...", "reason": "Rövid indoklás, miért ajánlod" }
      VÁLASZ CSUPASZ JSON LEGYEN!
    `;

    try {
      if (!this.configService.get('GEMINI_API_KEY')) {
        return facilities.slice(0, 2).map(f => ({ id: f.id, reason: 'Ez egy szimulált ajánlás.' }));
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      console.error('Facility Matching Error:', error);
      return [];
    }
  }
}
