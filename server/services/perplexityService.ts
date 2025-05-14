import { log } from "../vite";

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityRequestOptions {
  model?: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: PerplexityMessage;
    delta?: { role: string; content: string };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: any[];
}

export async function generateAIResponse(question: string, context: string): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Missing PERPLEXITY_API_KEY");
  }

  const systemPrompt = `You are an AI assistant specifically designed to help website visitors with questions about the following company:
  
${context}

Respond in a helpful, professional manner. Be concise but thorough. Try to directly answer the question using the provided context.
If you don't know the answer, say so and offer to connect the user with a human representative.
Do not make up information that is not provided in the context.`;

  try {
    const requestOptions: PerplexityRequestOptions = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.2, // Lower temperature for more focused, deterministic responses
    };

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(requestOptions)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Perplexity API error: ${response.status} ${errorText}`, "perplexity");
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Unexpected response format from Perplexity API");
    }
  } catch (error) {
    log(`Error generating AI response: ${error}`, "perplexity");
    throw error;
  }
}