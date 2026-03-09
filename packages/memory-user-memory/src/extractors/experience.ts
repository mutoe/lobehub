import { renderPlaceholderTemplate } from '@lobechat/context-engine';
import { z } from 'zod';

import { experiencePrompt } from '../prompts';
import type { ExperienceMemory } from '../schemas';
import { ExperienceMemorySchema } from '../schemas';
import type { ExtractorTemplateProps } from '../types';
import { buildGenerateObjectSchema } from '../utils/zod';
import { BaseMemoryExtractor } from './base';

/** Schema that defaults undefined/null model output to empty memories (e.g. Gemini sometimes returns undefined) */
const ExperienceResultSchema = z.preprocess(
  (val) => (val == null ? { memories: [] } : val),
  ExperienceMemorySchema,
);

export class ExperienceExtractor extends BaseMemoryExtractor<ExperienceMemory> {
  getPrompt(): string {
    return experiencePrompt;
  }

  protected getPromptName(): string {
    return 'layer-experience';
  }

  getSchema() {
    return buildGenerateObjectSchema(ExperienceResultSchema, { name: 'experience_extraction' });
  }

  getResultSchema() {
    return ExperienceResultSchema;
  }

  getTemplateProps(options: ExtractorTemplateProps) {
    return {
      availableCategories: options.availableCategories,
      language: options.language,
      retrievedContext: options.retrievedContexts?.join('\n\n') || 'No similar memories retrieved.',
      sessionDate: options.sessionDate,
      topK: options.topK,
      username: options.username,
    };
  }

  buildUserPrompt(options: ExtractorTemplateProps): string {
    if (!this.promptTemplate) {
      throw new Error('Prompt template not loaded');
    }

    return renderPlaceholderTemplate(this.promptTemplate!, this.getTemplateProps(options));
  }
}
