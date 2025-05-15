import OpenAI from "openai";
import { log } from "../vite";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const MODEL = "gpt-4o";

/**
 * Generate a chatbot response using the OpenAI API
 * This uses direct integration rather than web scraping
 */
export async function generateChatbotResponse(
  message: string,
  companyInfo: any,
  previousMessages: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  try {
    // Create a system message with the company info
    const systemMessage = createSystemPrompt(companyInfo);
    
    // Format the conversation history
    const formattedMessages = [
      { role: "system", content: systemMessage },
      ...previousMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    log(`Sending request to OpenAI for chatbot response`, 'chatbot');
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    // Return the AI response
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    log(`Error generating chatbot response: ${error}`, 'error');
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

/**
 * Create a system prompt for the AI based on company information
 */
function createSystemPrompt(companyInfo: any): string {
  return `
You are an AI assistant for ${companyInfo.companyName || "this company"}. 
Use the following information to answer customer questions as accurately as possible:

COMPANY INFORMATION:
- Company Name: ${companyInfo.companyName || "Not specified"}
- Industry: ${companyInfo.industry || "Not specified"}
- Target Audience: ${companyInfo.targetAudience || "General customers"}
- Brand Voice: ${companyInfo.brandVoice || "Professional"}
- Products/Services: ${companyInfo.services || "Not specified"}
- Value Proposition: ${companyInfo.valueProposition || "Not specified"}
${companyInfo.additionalInfo ? `- Additional Information: ${companyInfo.additionalInfo}` : ""}

INSTRUCTIONS:
1. Always introduce yourself as the AI assistant for ${companyInfo.companyName || "this company"}.
2. Be helpful, friendly, and professional.
3. If you don't know the answer to a specific question about the company, politely acknowledge that and suggest the customer contact the company directly.
4. Keep responses concise but informative.
5. If asked about pricing or availability of specific products/services, suggest contacting the company for the most up-to-date information.
6. Maintain the brand voice: ${companyInfo.brandVoice || "Professional"}.

Now answer the customer's questions in a helpful way based on this information.
`;
}