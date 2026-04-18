import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    // 2026-ban a gemini-2.0-flash vagy gemini-3-flash a standard
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Finomítja a felhasználó kérdését egy "Prompt Engineer" szerepkörrel.
   */
  async refineQuestion(question: string): Promise<string> {
    const prompt = `
      Szerepkör: Te egy profi egészségügyi tanácsadó asszisztens vagy.
      Feladat: Finomítsd a felhasználó alábbi kérdését, hogy pontosabb, tudományosabb és könnyebben megválaszolható legyen egy LLM számára. 
      Fókuszálj a mentális és fizikai egyensúlyra. 
      Csak a finomított kérdést add vissza, semmi mást!
      
      Felhasználó kérdése: "${question}"
      Finomított változat:
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Refine Error:', error);
      return `Finomított: ${question} (hiba a generáláskor)`;
    }
  }

  /**
   * Megválaszolja a finomított kérdést.
   */
  async ask(refinedQuestion: string): Promise<string> {
    const prompt = `
      Szerepkör: Te egy kedves, támogató egyetemi mentor és egészségügyi szakértő vagy.
      Kontextus: Válaszolj a felhasználó kérdésére közérthetően, de tudományosan megalapozottan. 
      Használj Markdown formázást (listák, félkövér betűk).
      Fontos: Ha a kérdés súlyos orvosi problémára utal, mindig javasold szakember felkeresését!
      
      Kérdés: "${refinedQuestion}"
      Válasz:
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Ask Error:', error);
      return 'Sajnálom, technikai hiba történt a válaszadás során. Kérlek próbáld újra később!';
    }
  }
}
