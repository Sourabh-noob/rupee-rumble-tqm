import { GoogleGenAI, Type } from "@google/genai";
import { Question, ImageSize } from "../types";

// Initialize Gemini Client
// We handle the case where the API key is missing gracefully
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey.length > 0) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize Gemini client", e);
  }
}

export const generateTeamLogo = async (teamName: string, size: ImageSize): Promise<string> => {
  // If no API key or client, return placeholder immediately
  if (!ai) {
    return `https://picsum.photos/500/500?grayscale&blur=2`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `A high-quality, professional e-sports or trading team logo for a team named "${teamName}". 
            Style: Vector art, minimalist, financial, aggressive, bold colors. 
            On a dark background.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size, // 1K, 2K, or 4K
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating logo:", error);
    // Return a placeholder if generation fails
    return `https://picsum.photos/500/500?grayscale&blur=2`;
  }
};

export const generateGameQuestions = async (): Promise<Question[]> => {
  // If no API key or client, return fallback questions immediately
  if (!ai) {
    console.warn("Using fallback questions (No API Key provided)");
    return fallbackQuestions;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite", // Low latency model
      contents: "Generate 5 difficult, high-stakes finance, logic, or general knowledge multiple-choice questions for a trading game.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ["A", "B", "C", "D"],
              },
              correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
            },
            required: ["id", "text", "options", "correctAnswer"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return fallbackQuestions;
    
    return JSON.parse(text) as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    return fallbackQuestions;
  }
};

const fallbackQuestions: Question[] = [
  {
    id: "q1",
    text: "Which term describes a market condition where asset prices are rising or are expected to rise?",
    options: {
      A: "Bear Market",
      B: "Bull Market",
      C: "Stagflation",
      D: "Recession"
    },
    correctAnswer: "B"
  },
  {
    id: "q2",
    text: "What does 'IPO' stand for in the financial world?",
    options: {
      A: "Initial Public Offering",
      B: "International Payment Option",
      C: "Internal Profit Organization",
      D: "Immediate Purchase Order"
    },
    correctAnswer: "A"
  },
  {
    id: "q3",
    text: "Who is known as the 'Oracle of Omaha'?",
    options: {
      A: "Elon Musk",
      B: "Bill Gates",
      C: "Warren Buffett",
      D: "Jeff Bezos"
    },
    correctAnswer: "C"
  },
  {
    id: "q4",
    text: "Which currency is the most traded in the world?",
    options: {
      A: "Euro",
      B: "Japanese Yen",
      C: "US Dollar",
      D: "British Pound"
    },
    correctAnswer: "C"
  },
  {
    id: "q5",
    text: "What is the primary function of the IMF?",
    options: {
      A: "Regulate the Internet",
      B: "Manage Global Trade Stability",
      C: "Print Money for Nations",
      D: "Control Oil Prices"
    },
    correctAnswer: "B"
  }
];