
import { GoogleGenAI } from "@google/genai";
import { Question, ImageSize } from "../types";
import { globalRateLimiter, LIMIT_CONFIGS } from "../utils/rateLimiter";

// Standard logo generation service using Google GenAI SDK
export const generateTeamLogo = async (teamName: string, size: ImageSize): Promise<string> => {
  // Rate Limit Check
  const check = globalRateLimiter.check('ai_logo', LIMIT_CONFIGS.AI_GENERATION.limit, LIMIT_CONFIGS.AI_GENERATION.interval);
  if (!check.allowed) {
    console.warn(`Rate limit hit: AI Generation cooling down for ${Math.ceil(check.waitTime / 1000)}s`);
    return `https://picsum.photos/500/500?grayscale&blur=2`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
            text: `A high-quality, professional e-sports or trading team logo for a team named "${teamName}". Style: Vector art, minimalist, financial, aggressive, bold colors. On a dark background.`
        }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" },
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
    return `https://picsum.photos/500/500?grayscale&blur=2`;
  }
};

// Returns the static list of 30 questions (6 rounds x 5 questions)
export const INITIAL_QUESTIONS: Question[] = [
    // --- ROUND 1: SILICON & SYNTHETICS (TECH) ---
    {
        id: 'r1_q1',
        roundNumber: 1,
        questionNumber: 1,
        text: "DeepSeek-V3 utilized which specialized architecture to achieve training efficiency comparable to GPT-4o at a fraction of the cost?",
        options: { A: "Sparse Autoencoders", B: "Multi-Head Latent Attention (MLA)", C: "Retentive Networks", D: "BitNet 1.58b" },
        correctAnswer: 'B'
    },
    {
        id: 'r1_q2',
        roundNumber: 1,
        questionNumber: 2,
        text: "NVIDIA's 2025 'Blackwell' architecture introduces the 'Fifth-Generation NVLink', allowing how many GPUs to act as a single unit?",
        options: { A: "32", B: "64", C: "72", D: "128" },
        correctAnswer: 'C'
    },
    {
        id: 'r1_q3',
        roundNumber: 1,
        questionNumber: 2,
        text: "Which AI model series introduced 'System 2' thinking through reinforcement learning and chain-of-thought in late 2024?",
        options: { A: "Claude 3.5 Sonnet", B: "Gemini 1.5 Pro", C: "OpenAI o1 (Strawberry)", D: "Llama 4-Alpha" },
        correctAnswer: 'C'
    },
    {
        id: 'r1_q4',
        roundNumber: 1,
        questionNumber: 4,
        text: "As of October 14, 2025, Windows 10 enters 'Extended Security Updates' (ESU). What is the estimated annual cost for a commercial user for the first year of ESU?",
        options: { A: "$30", B: "$61", C: "$122", D: "$20" },
        correctAnswer: 'B'
    },
    {
        id: 'r1_q5',
        roundNumber: 1,
        questionNumber: 5,
        text: "The 2025 'AI Safety Summit' held in France focused heavily on which specific risk category?",
        options: { A: "Job Displacement", B: "Deepfake Fraud", C: "Frontier Model Misuse (CBRN)", D: "Copyright Infringement" },
        correctAnswer: 'C'
    },
    // --- ROUND 2: FISCAL FRONTIERS (MARKETS) ---
    {
        id: 'r2_q1',
        roundNumber: 2,
        questionNumber: 1,
        text: "Which asset class officially surpassed Silver's global market cap for the first time in late 2024/early 2025?",
        options: { A: "NVIDIA Stock", B: "Bitcoin", C: "Saudi Aramco", D: "Total Global REITs" },
        correctAnswer: 'B'
    },
    {
        id: 'r2_q2',
        roundNumber: 2,
        questionNumber: 2,
        text: "The US 'D.O.G.E.' initiative, led by Musk, aims to cut federal spending by what staggering target amount over its mandate?",
        options: { A: "$500 Billion", B: "$1 Trillion", C: "$2 Trillion", D: "$4 Trillion" },
        correctAnswer: 'C'
    },
    {
        id: 'r2_q3',
        roundNumber: 2,
        questionNumber: 3,
        text: "India's NSE (National Stock Exchange) became the world's largest exchange in 2024/25 specifically in terms of?",
        options: { A: "Market Cap", B: "Equity Derivatives Volume", C: "Number of IPOs", D: "Bond Trading" },
        correctAnswer: 'B'
    },
    {
        id: 'r2_q4',
        roundNumber: 2,
        questionNumber: 4,
        text: "The 'Carry Trade' unwinding that shook global markets in mid-2024 and early 2025 was primarily triggered by interest rate hikes from?",
        options: { A: "The Federal Reserve", B: "Bank of Japan", C: "ECB", D: "Reserve Bank of India" },
        correctAnswer: 'B'
    },
    {
        id: 'r2_q5',
        roundNumber: 2,
        questionNumber: 5,
        text: "In 2025, which company became the first to reach a $4 Trillion market capitalization?",
        options: { A: "Apple", B: "Microsoft", C: "NVIDIA", D: "Alphabet" },
        correctAnswer: 'C'
    },
    // --- ROUND 3: CULTURAL CATALYSTS (POP CULTURE) ---
    {
        id: 'r3_q1',
        roundNumber: 3,
        questionNumber: 1,
        text: "The 2025 Met Gala theme 'Superfine: Tailoring Black Style' is inspired by which author's book 'Slaves to Fashion'?",
        options: { A: "Andre Leon Talley", B: "Monica L. Miller", C: "Zadie Smith", D: "Ta-Nehisi Coates" },
        correctAnswer: 'B'
    },
    {
        id: 'r3_q2',
        roundNumber: 3,
        questionNumber: 2,
        text: "Who is the director of the 2025 live-action 'Minecraft' movie, starring Jack Black and Jason Momoa?",
        options: { A: "Greta Gerwig", B: "Jared Hess", C: "Chris Columbus", D: "Shawn Levy" },
        correctAnswer: 'B'
    },
    {
        id: 'r3_q3',
        roundNumber: 3,
        questionNumber: 3,
        text: "The Oasis '25 reunion tour utilized which controversial ticket pricing model that sparked a UK government inquiry?",
        options: { A: "Dutch Auction", B: "Dynamic Pricing", C: "Subscription Access", D: "NFT Gating" },
        correctAnswer: 'B'
    },
    {
        id: 'r3_q4',
        roundNumber: 3,
        questionNumber: 4,
        text: "Which video game won 'Game of the Year' at the 2024 Game Awards, dominating pop culture discussions into 2025?",
        options: { A: "Black Myth: Wukong", B: "Elden Ring: Shadow of the Erdtree", C: "Astro Bot", D: "Final Fantasy VII Rebirth" },
        correctAnswer: 'B'
    },
    {
        id: 'r3_q5',
        roundNumber: 3,
        questionNumber: 5,
        text: "HBO's 'The Last of Us' Season 2, premiering in 2025, primarily adapts which portion of the game franchise?",
        options: { A: "The First Half of Part II", B: "The Entirety of Part II", C: "A Bridge Story (DLC)", D: "A Completely Original Script" },
        correctAnswer: 'A'
    },
    // --- ROUND 4: VELOCITY & VICTORIES (SPORTS) ---
    {
        id: 'r4_q1',
        roundNumber: 4,
        questionNumber: 1,
        text: "Who was officially announced as Lewis Hamilton's successor at Mercedes for the 2025 Formula 1 season?",
        options: { A: "Carlos Sainz", B: "Kimi Antonelli", C: "Mick Schumacher", D: "George Russell" },
        correctAnswer: 'B'
    },
    {
        id: 'r4_q2',
        roundNumber: 4,
        questionNumber: 2,
        text: "The 2025 ICC Champions Trophy adopted which format following India's refusal to travel to Pakistan?",
        options: { A: "Hybrid Model", B: "Total Relocation to UAE", C: "Cancellation", D: "Single-Venue (Sri Lanka)" },
        correctAnswer: 'A'
    },
    {
        id: 'r4_q3',
        roundNumber: 4,
        questionNumber: 3,
        text: "The 2025 'Olympic Esports Games' in Riyadh will feature 'physical virtual sports'. Which of these is a confirmed focus?",
        options: { A: "Dota 2", B: "Zwift Cycling", C: "CS:GO", D: "Minecraft Spleef" },
        correctAnswer: 'B'
    },
    {
        id: 'r4_q4',
        roundNumber: 4,
        questionNumber: 4,
        text: "In 2025, which tennis legend officially enters their first full year of retirement following the 2024 Davis Cup Finals?",
        options: { A: "Roger Federer", B: "Rafael Nadal", C: "Novak Djokovic", D: "Andy Murray" },
        correctAnswer: 'B'
    },
    {
        id: 'r4_q5',
        roundNumber: 4,
        questionNumber: 5,
        text: "The newly formatted 32-team FIFA Club World Cup 2025 is scheduled to be played in which US month?",
        options: { A: "January", B: "June/July", C: "September", D: "December" },
        correctAnswer: 'B'
    },
    // --- ROUND 5: QUANTUM & QUASARS (SCIENCE) ---
    {
        id: 'r5_q1',
        roundNumber: 5,
        questionNumber: 1,
        text: "The UN has declared 2025 as the International Year of what specific scientific field?",
        options: { A: "Artificial Intelligence", B: "Quantum Science & Technology", C: "Space Exploration", D: "Climate Resilience" },
        correctAnswer: 'B'
    },
    {
        id: 'r5_q2',
        roundNumber: 5,
        questionNumber: 2,
        text: "SpaceX's 'Starship' Flight 5 was historic for catching the 'Super Heavy' booster using what specific ground mechanism?",
        options: { A: "Magnetic Tether", B: "Mechazilla (Chopsticks)", C: "Autonomous Barge", D: "Parachute Net" },
        correctAnswer: 'B'
    },
    {
        id: 'r5_q3',
        roundNumber: 5,
        questionNumber: 3,
        text: "NASA's Artemis II mission, slated for late 2025, will be the first time humans have left Low Earth Orbit since which year?",
        options: { A: "1969", B: "1972", C: "1981", D: "1995" },
        correctAnswer: 'B'
    },
    {
        id: 'r5_q4',
        roundNumber: 5,
        questionNumber: 4,
        text: "In 2025, the 'Solar Maximum' is expected to reach its peak in Solar Cycle 25. This cycle is characterized by an increase in?",
        options: { A: "Gravity Waves", B: "Sunspots and Solar Flares", C: "Lunar Eclipses", D: "Ultraviolet Ray Absorption" },
        correctAnswer: 'B'
    },
    {
        id: 'r5_q5',
        roundNumber: 5,
        questionNumber: 5,
        text: "The 'James Webb Space Telescope' (JWST) in 2025 is prioritizing the search for 'Biosignatures' in the atmosphere of which exoplanet system?",
        options: { A: "Proxima Centauri", B: "TRAPPIST-1", C: "Kepler-186f", D: "Alpha Centauri" },
        correctAnswer: 'B'
    },
    // --- ROUND 6: THE GLOBAL STAGE (GEOPOLITICS) ---
    {
        id: 'r6_q1',
        roundNumber: 6,
        questionNumber: 1,
        text: "Which nation officially takes over the G20 Presidency for 2025, the first time it has ever hosted the summit?",
        options: { A: "South Africa", B: "Vietnam", C: "Nigeria", D: "Mexico" },
        correctAnswer: 'A'
    },
    {
        id: 'r6_q2',
        roundNumber: 6,
        questionNumber: 2,
        text: "Expo 2025, a massive world fair, is being hosted in which Japanese city starting in April?",
        options: { A: "Tokyo", B: "Osaka", C: "Kyoto", D: "Nagoya" },
        correctAnswer: 'B'
    },
    {
        id: 'r6_q3',
        roundNumber: 6,
        questionNumber: 3,
        text: "The 'COP30' climate summit in late 2025 will be held in Belém, Brazil. Why is this location strategically significant?",
        options: { A: "It's the capital", B: "It's the gateway to the Amazon", C: "It's the most industrial city", D: "It has the largest port" },
        correctAnswer: 'B'
    },
    {
        id: 'r6_q4',
        roundNumber: 6,
        questionNumber: 4,
        text: "In early 2025, which major European nation held a 'Snap Election' following the collapse of its 'Traffic Light' coalition?",
        options: { A: "France", B: "Germany", C: "Italy", D: "Netherlands" },
        correctAnswer: 'B'
    },
    {
        id: 'r6_q5',
        roundNumber: 6,
        questionNumber: 5,
        text: "The 'Great Wealth Transfer' projected to peak in 2025 refers to trillions of dollars moving from which generation to Millennials/Gen Z?",
        options: { A: "Silent Generation", B: "Baby Boomers", C: "Gen X", D: "The Greatest Generation" },
        correctAnswer: 'B'
    }
];

export const generateGameQuestions = async (): Promise<Question[]> => {
  return INITIAL_QUESTIONS;
};
