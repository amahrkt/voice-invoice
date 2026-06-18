/**
 * STT (Speech-to-Text) wrapper using OpenAI Whisper API.
 * Requirements: 2.1, 2.2
 */

import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env automatically

/**
 * Transcribes an audio buffer to text using OpenAI Whisper (whisper-1).
 * Audio is transcribed in Indonesian (language: "id").
 *
 * @param audioBuffer - Raw audio bytes in WAV or WebM format
 * @param mimeType    - MIME type of the audio buffer
 * @returns The transcribed text string
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: "audio/wav" | "audio/webm"
): Promise<string> {
  const ext = mimeType === "audio/wav" ? "wav" : "webm";
  const file = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "id",
    response_format: "text",
  });

  // When response_format is "text", the SDK returns a plain string
  // but types it as a Transcription object — cast accordingly.
  return response as unknown as string;
}
