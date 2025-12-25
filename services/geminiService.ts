import { GoogleGenAI } from "@google/genai";
import { Player } from '../types';

/**
 * Generates a tactical drill description based on a coach's prompt.
 */
export const generateDrillSuggestion = async (prompt: string, sport: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const fullPrompt = `
      Act as an expert ${sport} coach. 
      Create a concise, high-intensity drill description based on this request: "${prompt}".
      Include:
      1. Drill Name
      2. Objective
      3. Setup instructions
      4. Key coaching points.
      Keep it under 200 words. Format with simple markdown.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });

    return response.text || "Could not generate drill. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI assistant. Please check your API key.";
  }
};

export const generatePerformanceSummary = async (player: Player): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const stats = player.gameHistory.reduce((acc, game) => {
        acc.goals += game.goals;
        acc.assists += game.assists;
        acc.minutes += game.minutesPlayed;
        return acc;
    }, { goals: 0, assists: 0, minutes: 0 });

    const prompt = `
      Analyze the performance of football player ${player.name} (${player.position}).
      Stats: ${player.gameHistory.length} games played, ${stats.goals} goals, ${stats.assists} assists.
      Coach Notes: "${player.notes || 'None'}".
      Bio: "${player.bio || 'None'}".
      
      Write a professional 3-sentence performance summary highlighting strengths and areas for improvement.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate summary.";
  }
};

export const generateMatchStrategy = async (teamName: string, opponent: string, players: Player[], notes?: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';
        const rosterSummary = players.map(p => `${p.name} (${p.position}, ${p.status})`).join(', ');
        const prompt = `
            Act as a tactical analyst for ${teamName}.
            Upcoming Opponent: ${opponent}.
            Roster: ${rosterSummary}.
            Coach's Pre-game Notes: "${notes || 'None'}".

            Provide a match strategy including:
            1. Suggested Formation
            2. Key Player Roles
            3. Attacking Strategy
            4. Defensive Strategy

            Keep it concise and actionable.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text || "Strategy generation failed.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error generating strategy.";
    }
}

export const generateTrainingPlan = async (position: string, experience: string, goals: string, sport: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash'; 
    const prompt = `
      Act as a professional ${sport} coach.
      Create a comprehensive weekly training plan for a player with the following profile:
      - Position: ${position}
      - Experience Level: ${experience}
      - Primary Goals: ${goals}

      The plan should include:
      1. Weekly Schedule (Day by Day breakdown)
      2. Specific Drills for the position and goals
      3. Recovery tips
      4. Mental preparation advice.

      Format the response in clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not generate training plan.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating training plan.";
  }
};
