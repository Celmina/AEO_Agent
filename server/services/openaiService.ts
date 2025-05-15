import { log } from "../vite";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Generate an AI response to a user question using OpenAI's GPT-4o model
 * 
 * @param question The user's question
 * @param context The company and website context to inform the AI response
 * @returns The AI-generated answer
 */
export async function generateAIResponse(question: string, context: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  // Parse the context to extract company guidelines if provided
  let parsedContext: any = {};
  try {
    if (context.includes('{') && context.includes('}')) {
      // Extract JSON from context if it exists
      const jsonStart = context.indexOf('{');
      const jsonEnd = context.lastIndexOf('}') + 1;
      const jsonStr = context.substring(jsonStart, jsonEnd);
      parsedContext = JSON.parse(jsonStr);
    }
  } catch (e) {
    log(`Error parsing context JSON: ${e}`, 'error');
  }

  // Extract company guidelines if they exist
  const companyGuidelines = parsedContext.companyGuidelines || '';
  
  // Clean up context for the prompt (remove JSON if it was included)
  let cleanContext = context;
  if (parsedContext.companyGuidelines) {
    // Remove the JSON part from the context
    const jsonStart = context.indexOf('{');
    const jsonEnd = context.lastIndexOf('}') + 1;
    cleanContext = context.substring(0, jsonStart) + context.substring(jsonEnd);
  }
  
  // Create system prompt with guidelines included
  const systemPrompt = `You are an AI assistant specifically designed to help website visitors with questions about the following company and website:
  
${cleanContext}

${companyGuidelines ? `COMPANY GUIDELINES AND ADDITIONAL INFORMATION:
${companyGuidelines}

` : ''}IMPORTANT RULES:
1. ONLY answer questions about this specific company/website based on the context provided.
2. If asked about ecom.ai or any other companies, politely explain you're here to assist with questions about THIS company/website only.
3. Respond in a helpful, professional manner that matches the company's brand voice.
4. Be concise but thorough. Try to directly answer the question using the provided context.
5. If you don't know the answer, say so and offer to connect the user with a human representative.
6. DO NOT make up information that is not provided in the context.
7. DO NOT refer to yourself as ChatGPT, GPT, or OpenAI - you are this company's website assistant.`;

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