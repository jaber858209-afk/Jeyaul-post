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
    contents: `Generate high-impact social media posts based on this input: "${topic}". 
    
    Requirements:
    1. LinkedIn Post:
       - Professional, engaging, and comprehensive (up to 3,000 characters).
       - Use a "serial form" (structured, sequential breakdown with clear headings, emojis, and bullet points).
       - Structure:
         * **Bold Catchy Title** (using emojis like 🚀, 💼, ✍️)
         * Engaging Hook
         * Bulleted breakdown of key points (using ✔️ or similar)
         * Summary/Insight
         * Call to action (using 👉)
       - Make it look visually appealing with appropriate spacing and formatting.
    
    2. Twitter Post:
       - Strictly under 280 characters including hashtags.
       - Punchy, high-energy summary.
       - Use emojis and a clear structure even in short form.
    
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
  try {
    // First, generate a highly descriptive and stylistic image prompt using the text model
    const promptResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a professional image generation prompt for the topic: "${topic}". 
      
      Style Requirements:
      - Visual Style: Professional social media infographic or carousel slide.
      - Background: Dark, sleek background (e.g., charcoal, deep navy, or black).
      - Accents: Vibrant neon accents (e.g., neon green, cyan, or orange) that match the topic's vibe.
      - Elements: Minimalist icons representing key concepts (e.g., chat bubbles, gears, cloud, code brackets).
      - Typography: Clean, bold headings with high-quality typography.
      - Composition: Balanced and modern, optimized for LinkedIn/Twitter feeds.
      
      Return ONLY the prompt text, no other text.`,
    });

    let detailedPrompt = promptResponse.text?.trim() || `A high-quality, professional social media illustration for the topic: "${topic}". Modern and clean aesthetic.`;
    
    // Clean up potential markdown wrapping from the text model
    detailedPrompt = detailedPrompt.replace(/^```[\w]*\n/, '').replace(/\n```$/, '').trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: detailedPrompt }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidates returned from image model");
    }

    if (candidate.finishReason === 'SAFETY') {
      throw new Error("Image generation blocked by safety filters. Please try a different topic.");
    }

    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.error("Image model response parts:", candidate.content?.parts);
    throw new Error("No image data found in the response parts");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}
