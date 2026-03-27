import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SocialPost {
  linkedin: {
    text: string;
    hashtags: string[];
  };
  twitter: {
    text: string;
    hashtags: string[];
  };
}

export async function generatePostContent(topic: string): Promise<SocialPost> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate social media posts for the topic: "${topic}". 
    The LinkedIn post should be professional, engaging, and comprehensive (up to 3,000 characters).
    The Twitter post must be strictly under 280 characters including hashtags.
    Return the response as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linkedin: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["text", "hashtags"]
          },
          twitter: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["text", "hashtags"]
          }
        },
        required: ["linkedin", "twitter"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generatePostImage(topic: string): Promise<string> {
  // First, generate a highly descriptive and stylistic image prompt using the text model
  const promptResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a professional image generation prompt for the topic: "${topic}". 
    The prompt should be highly descriptive and specify a distinct visual style such as 'flat design', 'minimalist 3D render', 'vibrant digital art', 'cinematic photography', or 'isometric illustration'. 
    Include details about lighting, color palette (e.g., 'vibrant colors', 'monochromatic', 'pastel'), and composition. 
    Return ONLY the prompt text, no other text.`,
  });

  const detailedPrompt = promptResponse.text?.trim() || `A high-quality, professional social media illustration for the topic: "${topic}". Modern and clean aesthetic.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: detailedPrompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}
