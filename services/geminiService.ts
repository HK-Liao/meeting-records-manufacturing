import { GoogleGenAI } from "@google/genai";

// Helper to get the AI instance with the current API Key
// Prioritizes process.env.API_KEY as per guidelines
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure it is configured in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Model constants
const AUDIO_MODEL = 'gemini-2.5-flash'; // Good for multimodal
const TEXT_MODEL = 'gemini-2.5-flash'; // Fast and efficient for text tasks

/**
 * Transcribes an audio file using Gemini Multimodal capabilities.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Please provide a highly accurate, verbatim transcript of this audio file.
            
            **Language Instructions:**
            - Detect the primary language of the audio.
            - If the language is **Mandarin/Chinese**, you MUST transcribe it in **Traditional Chinese (Taiwan usage)** (繁體中文).
            - If the language is English, keep it in English.
            - If the language is Japanese, keep it in Japanese.
            
            **Formatting:**
            - Identify speakers if possible (e.g., Speaker 1, Speaker 2).
            - Do not summarize yet; just transcribe what is said.
            - If there is silence or noise, ignore it.`,
          },
        ],
      },
    });

    return response.text || "No transcript generated.";
  } catch (error: any) {
    console.error("Transcription error:", error);
    throw new Error(error.message || "Failed to transcribe audio.");
  }
};

/**
 * Corrects the transcript for grammar and clarity.
 */
export const correctTranscript = async (rawTranscript: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `You are a professional editor. Please correct the following meeting transcript for grammar, punctuation, and clarity.
      
      **Important Constraints:**
      - Maintain the **original language** of the transcript.
      - If the text is in Chinese, ensure it uses **Traditional Chinese (Taiwan)**.
      - Fix typos and phonetic errors.
      - Ensure the text flows naturally.
      - **DO NOT** summarize or remove content. Keep the original meaning and speaker labels.
      
      Transcript to correct:
      ${rawTranscript}`,
    });

    return response.text || rawTranscript;
  } catch (error: any) {
    console.error("Correction error:", error);
    throw new Error("Failed to correct transcript.");
  }
};

/**
 * Generates structured meeting minutes from the transcript.
 */
export const generateMeetingMinutes = async (transcript: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `You are an expert executive assistant. Based on the following meeting transcript, generate structured Meeting Minutes in Markdown format.
      
      **Language Rules:**
      - The output language MUST match the primary language of the transcript.
      - If the transcript is in Chinese, the minutes MUST be in **Traditional Chinese (Taiwan)**.
      
      The output should strictly follow this structure (translate headers if output is not English):
      # Meeting Minutes / 會議紀錄
      
      ## 1. Summary / 摘要
      (A brief executive summary of the meeting)

      ## 2. Attendees / 出席人員
      (List of inferred speakers or names mentioned)

      ## 3. Key Discussion Points / 重點討論事項
      (Bulleted list of main topics discussed)

      ## 4. Decisions Made / 決議事項
      (List of any conclusions or agreements reached)

      ## 5. Action Items / 待辦事項
      (Checklist of tasks assigned to specific people, if any)

      ---
      Transcript:
      ${transcript}`,
    });

    return response.text || "No minutes generated.";
  } catch (error: any) {
    console.error("Minutes generation error:", error);
    throw new Error("Failed to generate meeting minutes.");
  }
};