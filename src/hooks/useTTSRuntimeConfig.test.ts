import { type UserTTSConfig } from '@lobechat/types';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';

import {
  getTTSVoiceIdentity,
  useTTSRuntimeConfig,
  useTTSVoiceIdentity,
} from './useTTSRuntimeConfig';

vi.mock('@/business/client/hooks/useBusinessTTSProvider', () => ({
  useBusinessTTSProvider: () => 'biz-tts',
}));
vi.mock('@/services/_header', () => ({
  createHeaderWithOpenAI: (header?: Record<string, string>) => ({
    ...header,
    'X-openai-api-key': 'openai-key',
  }),
}));
vi.mock('@/store/user', () => ({ useUserStore: vi.fn() }));
vi.mock('@/store/user/selectors', () => ({
  settingsSelectors: { currentTTS: (s: { tts: UserTTSConfig }) => s.tts },
}));
vi.mock('@/store/serverConfig', () => ({
  serverConfigSelectors: {
    enableBusinessFeatures: (s: { enableBusinessFeatures: boolean }) => s.enableBusinessFeatures,
  },
  useServerConfigStore: vi.fn(),
}));

const REFERENCE_ID = '7cc066528f1a4cfb97de0190fb0c025f';

const setup = ({
  enableBusinessFeatures = false,
  ...tts
}: Partial<UserTTSConfig> & { enableBusinessFeatures?: boolean } = {}) => {
  const state = {
    tts: {
      fishAudio: {},
      openAI: { sttModel: 'whisper-1', ttsModel: 'tts-1' },
      sttAutoStop: true,
      sttServer: 'openai',
      ttsService: 'openai',
      ...tts,
    } as UserTTSConfig,
  };

  vi.mocked(useUserStore).mockImplementation((selector: any) => selector(state));
  vi.mocked(useServerConfigStore).mockImplementation((selector: any) =>
    selector({ enableBusinessFeatures }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTTSVoiceIdentity', () => {
  // Every audio file generated before this fork stored a bare OpenAI voice name. Namespacing
  // OpenAI too would compare unequal and silently regenerate all of them.
  it('leaves OpenAI voices bare so existing cached audio still matches', () => {
    expect(getTTSVoiceIdentity('openai', 'alloy')).toBe('alloy');
  });

  it('namespaces other services so switching invalidates cached audio', () => {
    expect(getTTSVoiceIdentity('fishaudio', REFERENCE_ID)).toBe(`fishaudio:${REFERENCE_ID}`);
    expect(getTTSVoiceIdentity('fishaudio', '')).not.toBe('alloy');
  });
});

describe('useTTSRuntimeConfig', () => {
  it('routes to the OpenAI endpoint with the agent voice and the configured model', () => {
    setup({ openAI: { sttModel: 'whisper-1', ttsModel: 'tts-1-hd' } });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.api!.serviceUrl).toBe('/webapi/tts/openai');
    expect(result.current.options).toEqual({ model: 'tts-1-hd', voice: 'nova' });
    expect(result.current.voiceIdentity).toBe('nova');
  });

  it('routes to the Fish Audio endpoint with the free model and the reference id', () => {
    setup({ fishAudio: { referenceId: REFERENCE_ID }, ttsService: 'fishaudio' });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.api!.serviceUrl).toBe('/webapi/tts/fishaudio');
    expect(result.current.options).toEqual({ model: 's2.1-pro-free', voice: REFERENCE_ID });
    expect(result.current.voiceIdentity).toBe(`fishaudio:${REFERENCE_ID}`);
  });

  it('falls back to the stock Fish Audio voice when no reference id is set', () => {
    setup({ ttsService: 'fishaudio' });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.options.voice).toBe('');
  });

  it('sends the Fish Audio key only to the Fish Audio endpoint', () => {
    setup({ fishAudio: { apiKey: 'sk-fish-secret' }, ttsService: 'fishaudio' });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.api!.headers).toMatchObject({ 'X-fishaudio-api-key': 'sk-fish-secret' });
  });

  // The key is user-supplied and provider-scoped; it must never ride along to a different
  // provider's endpoint just because it happens to be configured.
  it('never attaches the Fish Audio key while OpenAI is selected', () => {
    setup({ fishAudio: { apiKey: 'sk-fish-secret' }, ttsService: 'openai' });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.api!.headers).not.toHaveProperty('X-fishaudio-api-key');
  });

  // Business deployments proxy TTS through their own provider; the fork's switch is a
  // self-host feature and must not hijack that routing.
  it('keeps business deployments on their own provider', () => {
    setup({ enableBusinessFeatures: true, ttsService: 'fishaudio' });

    const { result } = renderHook(() => useTTSRuntimeConfig('nova'));

    expect(result.current.api!.serviceUrl).toBe('/webapi/tts/biz-tts');
    expect(result.current.options.model).toBe('tts-1');
    expect(result.current.api!.headers).not.toHaveProperty('X-fishaudio-api-key');
  });
});

describe('useTTSVoiceIdentity', () => {
  it('tracks the agent voice under OpenAI', () => {
    setup();

    expect(renderHook(() => useTTSVoiceIdentity('alloy')).result.current).toBe('alloy');
  });

  it('ignores the agent voice under Fish Audio, which picks its voice globally', () => {
    setup({ fishAudio: { referenceId: REFERENCE_ID }, ttsService: 'fishaudio' });

    expect(renderHook(() => useTTSVoiceIdentity('alloy')).result.current).toBe(
      `fishaudio:${REFERENCE_ID}`,
    );
  });
});
