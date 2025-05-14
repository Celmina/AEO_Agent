import { log } from "../vite";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIResponse(question: string, context: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const systemPrompt = `You are an AI assistant specifically designed to help website visitors with questions about the following company:
  
${context}

Respond in a helpful, professional manner. Be concise but thorough. Try to directly answer the question using the provided context.
If you don't know the answer, say so and offer to connect the user with a human representative.
Do not make up information that is not provided in the context.`;

  try {
    log(`Generating AI response for question: "${question}"`, "openai");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.2, // Lower temperature for more focused, deterministic responses
      max_tokens: 500
    });

    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
      const responseText = response.choices[0].message.content || "";
      log(`AI generated response (first 100 chars): "${responseText.substring(0, 100)}..."`, "openai");
      return responseText;
    } else {
      throw new Error("Unexpected response format from OpenAI API");
    }
  } catch (error) {
    log(`Error generating AI response: ${error}`, "openai");
    throw error;
  }
}