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
    The LinkedIn post should be professional and engaging.
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
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `A high-quality, professional social media illustration or photo for the topic: "${topic}". Modern and clean aesthetic.` }
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
