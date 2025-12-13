import { GoogleGenAI, Type } from "@google/genai";
import { Question, ImageSize } from "../types";

// Initialize Gemini Client
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
  if (!ai) return `https://picsum.photos/500/500?grayscale&blur=2`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{
            text: `A high-quality, professional e-sports or trading team logo for a team named "${teamName}". Style: Vector art, minimalist, financial, aggressive, bold colors. On a dark background.`
        }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: size },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generating logo:", error);
    return `https://picsum.photos/500/500?grayscale&blur=2`;
  }
};

// Returns a flat list of 25 questions (5 rounds x 5 questions)
export const generateGameQuestions = async (): Promise<Question[]> => {
  // Hardcoded "2025 Wrapped" Quiz for Rupee Rumble
  return get2025WrappedQuestions();
};

const get2025WrappedQuestions = (): Question[] => {
    return [
        // --- ROUND 1: TECH & AI ---
        {
            id: 'r1_q1',
            roundNumber: 1,
            questionNumber: 1,
            text: "Which Chinese AI lab released 'DeepSeek-V3', causing a massive stir in global chip stocks in early 2025?",
            options: { A: "Baidu", B: "DeepSeek", C: "Tencent", D: "Alibaba" },
            correctAnswer: 'B'
        },
        {
            id: 'r1_q2',
            roundNumber: 1,
            questionNumber: 2,
            text: "The NVIDIA 'Blackwell' GB200 super-chips, shipping in 2025, are primarily optimized for?",
            options: { A: "Gaming Graphics", B: "Crypto Mining", C: "AI Inference", D: "Mobile Processing" },
            correctAnswer: 'C'
        },
        {
            id: 'r1_q3',
            roundNumber: 1,
            questionNumber: 3,
            text: "Which widely used operating system officially reached its 'End of Life' (EOL) support in October 2025?",
            options: { A: "Windows 10", B: "macOS Sequoia", C: "Windows 11", D: "Ubuntu 20.04" },
            correctAnswer: 'A'
        },
        {
            id: 'r1_q4',
            roundNumber: 1,
            questionNumber: 4,
            text: "Elon Musk's xAI activated 'Colossus', the world's most powerful AI training cluster, using 100k of which GPU?",
            options: { A: "H100", B: "A100", C: "RTX 5090", D: "AMD MI300" },
            correctAnswer: 'A'
        },
        {
            id: 'r1_q5',
            roundNumber: 1,
            questionNumber: 5,
            text: "Meta's 'Orion' prototype, showcased extensively in 2025, represents the future of?",
            options: { A: "Brain Chips", B: "Holographic AR", C: "VR Gaming", D: "Smart Watches" },
            correctAnswer: 'B'
        },

        // --- ROUND 2: MARKETS & MONEY ---
        {
            id: 'r2_q1',
            roundNumber: 2,
            questionNumber: 1,
            text: "Which cryptocurrency officially shattered the $100,000 psychological barrier in late 2024/early 2025?",
            options: { A: "Ethereum", B: "Bitcoin", C: "Solana", D: "XRP" },
            correctAnswer: 'B'
        },
        {
            id: 'r2_q2',
            roundNumber: 2,
            questionNumber: 2,
            text: "The new US 'D.O.G.E.' department, led by Musk and Ramaswamy, stands for?",
            options: { A: "Dept of Gov Efficiency", B: "Digital Online Gov Entity", C: "Dept of General Energy", D: "Dogecoin Gov Exchange" },
            correctAnswer: 'A'
        },
        {
            id: 'r2_q3',
            roundNumber: 2,
            questionNumber: 3,
            text: "According to IMF projections for 2025, which country is solidifying its spot as the 3rd largest economy target?",
            options: { A: "Germany", B: "Japan", C: "India", D: "UK" },
            correctAnswer: 'C'
        },
        {
            id: 'r2_q4',
            roundNumber: 2,
            questionNumber: 4,
            text: "Which sector witnessed the highest volume of Venture Capital funding globally in Q1 2025?",
            options: { A: "FinTech", B: "Generative AI", C: "Green Hydrogen", D: "E-Commerce" },
            correctAnswer: 'B'
        },
        {
            id: 'r2_q5',
            roundNumber: 2,
            questionNumber: 5,
            text: "The 'Magnificent Seven' stocks driving the S&P 500 are primarily from which country?",
            options: { A: "China", B: "India", C: "USA", D: "Japan" },
            correctAnswer: 'C'
        },

        // --- ROUND 3: POP CULTURE ---
        {
            id: 'r3_q1',
            roundNumber: 3,
            questionNumber: 1,
            text: "Who headlined the Super Bowl LIX Halftime Show in New Orleans in February 2025?",
            options: { A: "Taylor Swift", B: "Drake", C: "Kendrick Lamar", D: "The Weeknd" },
            correctAnswer: 'C'
        },
        {
            id: 'r3_q2',
            roundNumber: 3,
            questionNumber: 2,
            text: "'The White Lotus' Season 3, released in 2025, was filmed in which country?",
            options: { A: "Japan", B: "Thailand", C: "France", D: "Mexico" },
            correctAnswer: 'B'
        },
        {
            id: 'r3_q3',
            roundNumber: 3,
            questionNumber: 3,
            text: "Which legendary British band reunited for a massive global stadium tour in 2025?",
            options: { A: "Pink Floyd", B: "Oasis", C: "One Direction", D: "The Smiths" },
            correctAnswer: 'B'
        },
        {
            id: 'r3_q4',
            roundNumber: 3,
            questionNumber: 4,
            text: "The 2025 Met Gala theme 'Superfine' focused on the history of?",
            options: { A: "Digital Fashion", B: "Black Dandyism", C: "Sustainable AI", D: "Retro Futurism" },
            correctAnswer: 'B'
        },
        {
            id: 'r3_q5',
            roundNumber: 3,
            questionNumber: 5,
            text: "Which highly anticipated Rockstar Games title is slated for a Fall 2025 release?",
            options: { A: "Half-Life 3", B: "GTA VI", C: "Red Dead 3", D: "Bully 2" },
            correctAnswer: 'B'
        },

        // --- ROUND 4: GLOBAL SPORTS ---
        {
            id: 'r4_q1',
            roundNumber: 4,
            questionNumber: 1,
            text: "Lewis Hamilton made his historic debut for which F1 team in the 2025 season?",
            options: { A: "Mercedes", B: "Red Bull", C: "Ferrari", D: "McLaren" },
            correctAnswer: 'C'
        },
        {
            id: 'r4_q2',
            roundNumber: 4,
            questionNumber: 2,
            text: "The 2025 ICC Champions Trophy hosting rights dispute involved which two nations?",
            options: { A: "Aus & Eng", B: "India & Pakistan", C: "SA & NZ", D: "SL & Ban" },
            correctAnswer: 'B'
        },
        {
            id: 'r4_q3',
            roundNumber: 4,
            questionNumber: 3,
            text: "The newly expanded FIFA Club World Cup 2025 was hosted by?",
            options: { A: "Saudi Arabia", B: "USA", C: "China", D: "Brazil" },
            correctAnswer: 'B'
        },
        {
            id: 'r4_q4',
            roundNumber: 4,
            questionNumber: 4,
            text: "Riyadh was officially selected to host the first-ever edition of what in 2025?",
            options: { A: "Winter Olympics", B: "Olympic Esports Games", C: "Cricket World Cup", D: "Rugby World Cup" },
            correctAnswer: 'B'
        },
        {
            id: 'r4_q5',
            roundNumber: 4,
            questionNumber: 5,
            text: "Kylian Mbappé completed his first full season with which club in 2025?",
            options: { A: "PSG", B: "Real Madrid", C: "Man City", D: "Liverpool" },
            correctAnswer: 'B'
        },

        // --- ROUND 5: SCIENCE & TOMORROW ---
        {
            id: 'r5_q1',
            roundNumber: 5,
            questionNumber: 1,
            text: "2025 is the Chinese Zodiac Year of the?",
            options: { A: "Dragon", B: "Snake", C: "Horse", D: "Rabbit" },
            correctAnswer: 'B'
        },
        {
            id: 'r5_q2',
            roundNumber: 5,
            questionNumber: 2,
            text: "NASA's Artemis II mission is scheduled to send astronauts to?",
            options: { A: "Mars Surface", B: "ISS", C: "Lunar Orbit", D: "Asteroid Belt" },
            correctAnswer: 'C'
        },
        {
            id: 'r5_q3',
            roundNumber: 5,
            questionNumber: 3,
            text: "What unprecedented maneuver did SpaceX's Starship successfully demonstrate?",
            options: { A: "Chopsticks Catch", B: "Water Landing", C: "Runway Glide", D: "Parachute Deploy" },
            correctAnswer: 'A'
        },
        {
            id: 'r5_q4',
            roundNumber: 5,
            questionNumber: 4,
            text: "The 'Solar Maximum' in 2025 caused which phenomenon to be visible globally?",
            options: { A: "Solar Flares", B: "Auroras", C: "Sunspots", D: "Eclipses" },
            correctAnswer: 'B'
        },
        {
            id: 'r5_q5',
            roundNumber: 5,
            questionNumber: 5,
            text: "By 2025, which port had completely replaced 'Lightning' on all new Apple accessories?",
            options: { A: "Thunderbolt", B: "USB-C", C: "MagSafe", D: "Wireless Only" },
            correctAnswer: 'B'
        }
    ];
};