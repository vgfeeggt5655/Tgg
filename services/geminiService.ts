
import { GoogleGenAI, Type } from "@google/genai";
import { MCQ, Flashcard } from '../types';

// FIX: Always use process.env.API_KEY directly in the GoogleGenAI constructor.
// Do not define a separate constant or check for the key's existence manually.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generationConfig = {
  temperature: 0.7,
  topP: 1,
  topK: 1,
};

// --- MCQ Generation Service ---
const mcqSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'The question text.',
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'An array of 4 possible answers.',
      },
      answer: {
        type: Type.STRING,
        description: 'The correct answer, which must be one of the strings in the options array.',
      },
    },
    required: ["question", "options", "answer"],
  },
};

export const generateMCQs = async (text: string, numQuestions: number = 20): Promise<MCQ[]> => {
  const prompt = `Based on the following text, generate a challenging quiz of ${numQuestions} multiple-choice questions in English. Each question must have exactly 4 options. Ensure the answer provided for each question is one of the options. Focus on the key concepts, definitions, and objectives presented in the text.\n\nText:\n"""${text}"""`;
  
  try {
    // FIX: Use ai.models.generateContent to query GenAI with both the model name and prompt.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        ...generationConfig,
        responseMimeType: "application/json",
        responseSchema: mcqSchema,
      },
    });

    // FIX: Access the generated text using the .text property, not as a method call.
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (Array.isArray(parsedJson)) {
        return parsedJson as MCQ[];
    } else {
        throw new Error("API response is not in the expected array format.");
    }
  } catch (error) {
    console.error("Error generating MCQs:", error);
    throw new Error("Failed to generate quiz. The AI model might be overloaded or the content is invalid.");
  }
};

// --- Summary Generation Service ---
export const generateSummary = async (text: string): Promise<string> => {
  const prompt = `Summarize the following text into concise, easy-to-understand bullet points. Focus on the main ideas and critical information.\n\nText:\n"""${text}"""`;
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: generationConfig
    });
    // FIX: Access the generated text using the .text property.
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary.");
  }
};


// --- Flashcard Generation Service ---
const flashcardSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            term: {
                type: Type.STRING,
                description: 'The key term or concept.'
            },
            definition: {
                type: Type.STRING,
                description: 'The definition or explanation of the term.'
            }
        },
        required: ["term", "definition"]
    }
};

export const generateFlashcards = async (text: string): Promise<Flashcard[]> => {
    const prompt = `From the following text, generate a set of flashcards. Each flashcard should represent a key term, concept, or important fact. Provide a clear and concise definition for each term.\n\nText:\n"""${text}"""`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                ...generationConfig,
                responseMimeType: "application/json",
                responseSchema: flashcardSchema,
            },
        });

        // FIX: Access the generated text using the .text property.
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (Array.isArray(parsedJson)) {
            return parsedJson as Flashcard[];
        } else {
            throw new Error("API response for flashcards is not in the expected format.");
        }
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("Failed to generate flashcards.");
    }
};

// --- Image Generation Service ---
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `A professional 3D render of an educational diagram, minimalist style, on a clean background, illustrating: ${prompt}`,
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
                }
            },
        });

        for (const part of response.candidates[0].content.parts) {
            // FIX: Correctly extract the image base64 data from the candidates parts.
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("API did not return any images.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

// --- Study Note Generation Service ---
export interface StudyNote {
  htmlContent: string;
  cssStyles: string;
}

const studyNoteSchema = {
    type: Type.OBJECT,
    properties: {
        htmlContent: {
            type: Type.STRING,
            description: "The full semantic HTML content of the textbook chapter."
        },
        cssStyles: {
            type: Type.STRING,
            description: "The complete CSS style sheet for the chapter."
        }
    },
    required: ["htmlContent", "cssStyles"]
};


export const generateStudyNote = async (text: string): Promise<StudyNote> => {
    const prompt = `You are an expert graphic designer and academic publisher. Your task is to transform raw text into a visually stunning, professional textbook chapter. You must return a JSON object containing two keys: "htmlContent" and "cssStyles".

**1. "cssStyles" Generation**:
- Design a complete, modern, and cohesive CSS stylesheet.
- Choose a professional color palette. Define these as CSS variables.
- Select elegant, readable fonts.
- Style all elements for a premium feel within a container ID'd as '#study-note-content'.

**2. "htmlContent" Generation**:
- Full semantic HTML for the chapter body. Restructure and format for a professional audience.
- Identify key concepts for visual aids using: \`<div class="image-placeholder" data-prompt="..."></div>\`.

Transform the following text:
\n\nText:\n"""${text}"""`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                 ...generationConfig,
                responseMimeType: "application/json",
                responseSchema: studyNoteSchema,
            }
        });
        // FIX: Access the generated text using the .text property.
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (parsedJson.htmlContent && parsedJson.cssStyles) {
            return parsedJson as StudyNote;
        } else {
            throw new Error("AI response is missing required htmlContent or cssStyles.");
        }
    } catch (error) {
        console.error("Error generating study note:", error);
        throw new Error("Failed to generate study note.");
    }
};
