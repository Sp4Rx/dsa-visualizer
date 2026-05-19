import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateVisualization(problemText: string, code?: string): Promise<AIResponse> {
    const prompt = code 
      ? `Analyze this JavaScript code for the problem: "${problemText}". 
         Code:
         ${code}
         
         Provide a step-by-step execution trace for a small example input.
         Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
         The JSON must follow this exact structure:
         {
           "solution": "the code",
           "explanation": "beginner friendly text",
           "steps": [
             { "line": number, "variables": { "varName": value }, "description": "text" }
           ]
         }`
      : `Solve this DSA problem: "${problemText}". 
         Provide a clean JavaScript solution, a beginner-friendly explanation, and a step-by-step execution trace for a small example input.
         Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
         The JSON must follow this exact structure:
         {
           "solution": "the code",
           "explanation": "beginner friendly text",
           "steps": [
             { "line": number, "variables": { "varName": value }, "description": "text" }
           ]
         }`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              solution: { type: Type.STRING, description: "The JavaScript solution code." },
              explanation: { type: Type.STRING, description: "Beginner-friendly explanation of the logic." },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.NUMBER, description: "The line number being executed (1-indexed)." },
                    variables: { type: Type.OBJECT, description: "Current state of variables." },
                    description: { type: Type.STRING, description: "What is happening at this step." },
                    action: { type: Type.STRING, description: "Optional action type for visualization (e.g., 'swap', 'compare')." }
                  },
                  required: ["line", "variables", "description"]
                }
              }
            },
            required: ["solution", "explanation", "steps"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("AI returned an empty response.");
      
      // Clean potential markdown artifacts just in case
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr) as AIResponse;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.message?.includes("API_KEY_INVALID")) {
        throw new Error("Invalid API Key. Please check your settings.");
      }
      throw error;
    }
  }
}
