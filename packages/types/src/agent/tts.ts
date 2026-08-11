/** `fishaudio` is a fork addition — see `UserTTSConfig.ttsService`. */
export type TTSServer = 'openai' | 'fishaudio';

export interface LobeAgentTTSConfig {
  showAllLocaleVoice?: boolean;
  sttLocale: 'auto' | string;
  ttsService: TTSServer;
  voice: {
    openai: string;
  };
}
