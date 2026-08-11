import type { UserTTSConfig } from '@lobechat/types';

export const DEFAULT_TTS_CONFIG: UserTTSConfig = {
  fishAudio: {},
  openAI: {
    sttModel: 'whisper-1',
    ttsModel: 'tts-1',
  },
  sttAutoStop: true,
  sttServer: 'openai',
  ttsService: 'openai',
};
