import type { TTSServer } from '../../agent/tts';

export type STTServer = 'openai' | 'browser';

export interface UserTTSConfig {
  /** Fork: Fish Audio text-to-speech. Only consulted when `ttsService` is `fishaudio`. */
  fishAudio: {
    /** Overrides the deployment's `FISH_AUDIO_API_KEY`; empty falls back to it. */
    apiKey?: string;
    /** Fish Audio voice model id. Empty means "use the provider's stock voice". */
    referenceId?: string;
  };
  openAI: {
    sttModel: 'whisper-1';
    ttsModel: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  };
  sttAutoStop: boolean;
  sttServer: STTServer;
  /** Fork: which service speaks. Upstream only ever had OpenAI. */
  ttsService: TTSServer;
}
