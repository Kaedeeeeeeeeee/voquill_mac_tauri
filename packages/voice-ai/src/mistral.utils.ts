import { countWords, retry } from "@voquill/utilities";
import type { CustomFetch } from "./types";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

export const MISTRAL_TRANSCRIPTION_MODELS = [
  "voxtral-mini-latest",
  "voxtral-mini-2507",
] as const;
export type MistralTranscriptionModel =
  (typeof MISTRAL_TRANSCRIPTION_MODELS)[number];

type MistralTranscriptionResponse = {
  text?: string;
  model?: string;
  language?: string | null;
};

export type MistralTranscriptionArgs = {
  apiKey: string;
  model?: MistralTranscriptionModel | string;
  blob: ArrayBuffer | Buffer;
  ext: string;
  language?: string;
  customFetch?: CustomFetch;
};

export type MistralTranscribeAudioOutput = {
  text: string;
  wordsUsed: number;
};

export const mistralTranscribeAudio = async ({
  apiKey,
  model = "voxtral-mini-latest",
  blob,
  ext,
  language,
  customFetch,
}: MistralTranscriptionArgs): Promise<MistralTranscribeAudioOutput> => {
  const fetchFn = customFetch ?? globalThis.fetch;

  return retry({
    retries: 3,
    fn: async () => {
      const form = new FormData();
      const arrayBuffer =
        blob instanceof ArrayBuffer ? blob : (blob.buffer as ArrayBuffer);
      form.append(
        "file",
        new Blob([arrayBuffer], { type: `audio/${ext}` }),
        `audio.${ext}`,
      );
      form.append("model", String(model));
      if (language && language !== "auto") {
        form.append("language", language);
      }

      const response = await fetchFn(
        `${MISTRAL_BASE_URL}/audio/transcriptions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          body: form,
        },
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `Mistral transcription failed (${response.status}): ${errText.slice(0, 300)}`,
        );
      }

      const payload = (await response.json()) as MistralTranscriptionResponse;
      const text = payload.text ?? "";
      if (!text) {
        throw new Error("Mistral transcription returned empty text");
      }

      return { text, wordsUsed: countWords(text) };
    },
  });
};

export type MistralTestIntegrationArgs = {
  apiKey: string;
  customFetch?: CustomFetch;
};

export const mistralTestIntegration = async ({
  apiKey,
  customFetch,
}: MistralTestIntegrationArgs): Promise<boolean> => {
  const fetchFn = customFetch ?? globalThis.fetch;

  const response = await fetchFn(`${MISTRAL_BASE_URL}/models`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Mistral API key check failed (${response.status}): ${errText.slice(0, 200)}`,
    );
  }

  return true;
};
